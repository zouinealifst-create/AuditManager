<?php

namespace App\Http\Controllers;

use App\Models\normes\Norme;
use App\Services\NormeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class NormeController extends Controller
{
    protected $normeService;

    public function __construct(NormeService $normeService)
    {
        $this->normeService = $normeService;
    }

    /**
     * Afficher la liste de toutes les normes.
     */
    public function index(): JsonResponse
    {
        $normes = $this->normeService->getAllNormes();

        return response()->json([
            'success' => true,
            'data'    => $normes,
        ]);
    }


    /**
     * Créer une nouvelle norme.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string|max:50|unique:normes,code',
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'version'     => 'nullable|string|max:20',
            'organisme'   => 'nullable|string|max:100',
            'secteur'     => 'nullable|string|max:100',
            'statut'      => 'nullable|in:actif,inactif',
        ]);

        $norme = $this->normeService->createNorme($validated);

        return response()->json([
            'success' => true,
            'message' => 'Norme créée avec succès.',
            'data'    => $norme,
        ], 201);
    }

    /**
     * Afficher une norme spécifique.
     */
    public function show(int $id): JsonResponse
    {
        $norme = $this->normeService->getNormeById($id);

        if (! $norme) {
            return response()->json([
                'success' => false,
                'message' => 'Norme non trouvée.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $norme,
        ]);
    }

    /**
     * Mettre à jour une norme existante.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $norme = $this->normeService->getNormeById($id);

        if (! $norme) {
            return response()->json([
                'success' => false,
                'message' => 'Norme non trouvée.',
            ], 404);
        }

        $validated = $request->validate([
            'code'        => ['sometimes', 'required', 'string', 'max:50', Rule::unique('normes', 'code')->ignore($id)],
            'nom'         => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'version'     => 'nullable|string|max:20',
            'organisme'   => 'nullable|string|max:100',
            'secteur'     => 'nullable|string|max:100',
            'statut'      => 'nullable|in:actif,inactif',
        ]);

        $this->normeService->updateNorme($norme, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Norme mise à jour avec succès.',
            'data'    => $norme,
        ]);
    }

    /**
     * Désactiver une norme (suppression logique).
     */
    public function destroy(int $id): JsonResponse
    {
        $norme = $this->normeService->getNormeById($id);

        if (! $norme) {
            return response()->json([
                'success' => false,
                'message' => 'Norme non trouvée.',
            ], 404);
        }

        $norme = $this->normeService->deactivateNorme($norme);

        return response()->json([
            'success' => true,
            'message' => 'Norme désactivée avec succès.',
            'data'    => $norme,
        ]);
    }
}
