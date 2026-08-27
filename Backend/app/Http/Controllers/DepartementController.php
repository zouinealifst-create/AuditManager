<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartementRequest;
use App\Http\Resources\DepartementResource;
use App\Models\Departement;
use App\Models\User;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);

        $departements = Departement::with(['entreprise', 'responsable', 'secteur'])
            ->withCount('users')
            ->latest()
            ->paginate($perPage);

        return DepartementResource::collection($departements);
    }

    public function store(DepartementRequest $request)
    {
        $departement = Departement::create($request->validated());

        $this->syncResponsableDepartement($departement);

        return new DepartementResource(
            $departement->fresh(['entreprise', 'responsable', 'secteur'])
        );
    }

    public function show(Departement $departement)
    {
        return new DepartementResource(
            $departement->load(['entreprise', 'responsable', 'secteur'])->loadCount('users')
        );
    }

    public function update(DepartementRequest $request, Departement $departement)
    {
        $oldResponsableId = $departement->responsable_id;

        $departement->update($request->validated());

        $this->syncResponsableDepartement($departement, $oldResponsableId);

        return new DepartementResource(
            $departement->fresh(['entreprise', 'responsable', 'secteur'])
        );
    }

    public function destroy(Departement $departement)
    {
        User::where('departement_id', $departement->id)->update(['departement_id' => null]);

        $departement->delete();

        return response()->json(['message' => 'Département supprimé avec succès.']);
    }

    private function syncResponsableDepartement(Departement $departement, ?int $oldResponsableId = null): void
    {
        if ($oldResponsableId && $oldResponsableId !== $departement->responsable_id) {
            User::where('id', $oldResponsableId)
                ->where('departement_id', $departement->id)
                ->update(['departement_id' => null]);
        }

        if ($departement->responsable_id) {
            User::where('id', $departement->responsable_id)
                ->update(['departement_id' => $departement->id]);
        }
    }
}