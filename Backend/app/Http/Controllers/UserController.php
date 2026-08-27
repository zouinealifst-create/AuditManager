<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\Departement;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private const ROLES_RESPONSABLES = ['Responsable Qualité', 'Responsable Département'];

    public function index()
    {
        $users = User::with(['role', 'departement'])->latest()->paginate(10);

        return UserResource::collection($users);
    }

    public function store(UserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);
        $user->load(['role', 'departement']);

        $this->syncDepartementResponsable($user);

        return new UserResource($user->fresh(['role', 'departement']));
    }

    public function show(User $user)
    {
        return new UserResource($user->load(['role', 'departement']));
    }

    public function update(UserRequest $request, User $user)
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $oldDepartementId = $user->departement_id;

        $user->update($data);
        $user->load(['role', 'departement']);

        $this->syncDepartementResponsable($user, $oldDepartementId);

        return new UserResource($user->fresh(['role', 'departement']));
    }

    public function destroy(User $user)
    {
        Departement::where('responsable_id', $user->id)->update(['responsable_id' => null]);

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

    public function toggleStatut(User $user)
    {
        $user->update([
            'statut' => $user->statut === 'actif' ? 'inactif' : 'actif',
        ]);

        return new UserResource($user->load(['role', 'departement']));
    }

    private function syncDepartementResponsable(User $user, ?int $oldDepartementId = null): void
    {
        if ($oldDepartementId && $oldDepartementId !== $user->departement_id) {
            Departement::where('id', $oldDepartementId)
                ->where('responsable_id', $user->id)
                ->update(['responsable_id' => null]);
        }

        $isResponsable = in_array($user->role?->name, self::ROLES_RESPONSABLES, true);

        if ($isResponsable && $user->departement_id) {
            Departement::where('id', $user->departement_id)
                ->update(['responsable_id' => $user->id]);
        } elseif (!$isResponsable) {
            Departement::where('responsable_id', $user->id)->update(['responsable_id' => null]);
        }
    }
}