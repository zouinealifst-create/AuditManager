<?php

namespace App\Http\Controllers;

use App\Http\Requests\EntrepriseRequest;
use App\Http\Resources\EntrepriseResource;
use App\Models\Entreprise;
use App\Services\NormeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    protected NormeService $normeService;

    public function __construct(NormeService $normeService)
    {
        $this->normeService = $normeService;
    }

    public function index()
    {
        $entreprises = Entreprise::withCount('departements')->latest()->paginate(10);

        return EntrepriseResource::collection($entreprises);
    }

    public function store(EntrepriseRequest $request)
    {
        $entreprise = Entreprise::create($request->validated());

        return new EntrepriseResource($entreprise);
    }

    public function show(Entreprise $entreprise)
    {
        return new EntrepriseResource($entreprise->loadCount('departements'));
    }

    public function update(EntrepriseRequest $request, Entreprise $entreprise)
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($entreprise->logo) {
                \Storage::disk('public')->delete($entreprise->logo);
            }

            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        $entreprise->update($data);

        return new EntrepriseResource($entreprise);
    }

    public function destroy(Entreprise $entreprise)
    {
        $entreprise->delete();

        return response()->json(['message' => 'Entreprise supprimée avec succès.']);
    }

    /**
     * Synchronise les secteurs d'une entreprise et met à jour ses normes actives.
     *
     * POST /api/entreprises/{entrepriseId}/secteurs
     */
    public function syncSecteurs(Request $request, int $entrepriseId): JsonResponse
    {
        $entreprise = Entreprise::find($entrepriseId);

        if (! $entreprise) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée.',
            ], 404);
        }

        $validated = $request->validate([
            'secteur_ids'   => 'required|array|min:1',
            'secteur_ids.*' => 'integer|exists:secteurs,id',
        ]);

        $syncResult = $this->normeService->syncSecteursForEntreprise(
            $entreprise,
            $validated['secteur_ids']
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'normes' => $entreprise->normes,
                'diff'   => $syncResult,
            ],
        ]);
    }
}