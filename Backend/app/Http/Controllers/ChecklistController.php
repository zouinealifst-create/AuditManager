<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class ChecklistController extends Controller
{
    /**
     * Afficher la liste des checklists.
     * Supporte le filtre optionnel ?entreprise_id=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Checklist::with([
            'norme:id,code,nom', 
            'createur:id,name',
            'questions' => function ($q) {
                $q->orderBy('ordre');
            }
        ]);

        if (! $request->user()->hasPermission('checklists.manage_all')) {
            $query->where('cree_par', $request->user()->id);
        }

        if ($request->filled('norme_id')) {
            $query->where('norme_id', $request->input('norme_id'));
        }

        if ($request->filled('departement_id')) {
            $departement = \App\Models\Departement::find($request->input('departement_id'));
            if ($departement && $departement->secteur_id) {
                $query->whereHas('norme.secteurs', function ($q) use ($departement) {
                    $q->where('secteurs.id', $departement->secteur_id);
                });
            } else {
                $query->whereRaw('1 = 0'); // département sans secteur -> aucune checklist
            }
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
        $checklist = Checklist::find($id);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        if ($checklist->cree_par !== $request->user()->id && ! $request->user()->hasPermission('checklists.manage_all')) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez gérer que vos propres checklists.',
            ], 403);
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
        $checklist = Checklist::find($id);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        if ($checklist->cree_par !== $request->user()->id && ! $request->user()->hasPermission('checklists.manage_all')) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez gérer que vos propres checklists.',
            ], 403);
        }

        try {
            $checklist->delete();
        } catch (QueryException $e) {
            // Code 23000 = violation de contrainte d'intégrité
            if ($e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer : cette checklist est utilisée par au moins un audit.',
                ], 409);
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Checklist supprimée avec succès.',
        ]);
    }


}
