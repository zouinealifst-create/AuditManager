<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChecklistController extends Controller
{
    /**
     * Afficher la liste des checklists.
     * Supporte le filtre optionnel ?entreprise_id=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Checklist::with(['norme:id,code,nom', 'createur:id,name'])
            ->withCount('questions');

        if ($request->filled('norme_id')) {
            $query->where('norme_id', $request->input('norme_id'));
        }

        $checklists = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $checklists,
        ]);
    }

    /**
     * Créer une nouvelle checklist.
     */
    public function store(Request $request): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $validated = $request->validate([
            'norme_id'      => 'required|integer|exists:normes,id',
            'titre'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'statut'        => 'nullable|in:brouillon,actif,archive',
        ]);

        $validated['cree_par'] = $request->user()->id;

        if (! isset($validated['statut'])) {
            $validated['statut'] = 'brouillon';
        }

        $checklist = Checklist::create($validated);
        $checklist->load(['norme:id,code,nom', 'createur:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Checklist créée avec succès.',
            'data'    => $checklist,
        ], 201);
    }

    /**
     * Afficher une checklist spécifique avec ses relations.
     */
    public function show(int $id): JsonResponse
    {
        $checklist = Checklist::with(['norme:id,code,nom', 'questions', 'createur:id,name'])
            ->find($id);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $checklist,
        ]);
    }

    /**
     * Mettre à jour une checklist existante.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $checklist = Checklist::find($id);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        $validated = $request->validate([
            'norme_id'      => 'sometimes|required|integer|exists:normes,id',
            'titre'         => 'sometimes|required|string|max:255',
            'description'   => 'nullable|string',
            'statut'        => 'nullable|in:brouillon,actif,archive',
        ]);

        $checklist->update($validated);
        $checklist->load(['norme:id,code,nom', 'createur:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Checklist mise à jour avec succès.',
            'data'    => $checklist,
        ]);
    }

    /**
     * Supprimer une checklist (et ses questions en cascade).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $checklist = Checklist::find($id);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        $checklist->delete();

        return response()->json([
            'success' => true,
            'message' => 'Checklist supprimée avec succès.',
        ]);
    }

    /**
     * Vérification temporaire du rôle (inline).
     * Seuls les utilisateurs « Responsable Qualité » ou « Admin » peuvent
     * effectuer des opérations d'écriture sur les checklists.
     *
     * TODO : Remplacer par un middleware/policy dédié lorsque Dev 1 livrera
     *        le système de gestion des rôles et permissions.
     */
    private function checkRole(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role?->name, ['Responsable Qualité', 'Admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée.',
            ], 403);
        }

        return null;
    }
}
