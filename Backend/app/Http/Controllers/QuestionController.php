<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    /**
     * Afficher les questions d'une checklist, triées par ordre.
     * Laravel injecte automatiquement la Checklist via le Route Model Binding
     * et retourne un 404 si elle n'existe pas — sans code manuel.
     */
    public function index(Request $request, Checklist $checklist): JsonResponse
    {
        $questions = $checklist->questions()->orderBy('ordre')->get();

        return response()->json([
            'success' => true,
            'data'    => $questions,
        ]);
    }

    /**
     * Ajouter une question à une checklist.
     */
    public function store(Request $request, int $checklistId): JsonResponse
    {
        // TODO : réactiver quand le système de login sera branché au frontend
        // $forbidden = $this->checkRole($request);
        // if ($forbidden) { return $forbidden; }

        $checklist = Checklist::find($checklistId);

        if (! $checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Checklist non trouvée.',
            ], 404);
        }

        $validated = $request->validate([
            'texte' => 'required|string',
            'ordre' => 'nullable|integer',
        ]);

        // Si l'ordre n'est pas fourni, on le place à la fin
        if (! isset($validated['ordre'])) {
            $maxOrdre = $checklist->questions()->max('ordre') ?? 0;
            $validated['ordre'] = $maxOrdre + 1;
        }

        $validated['checklist_id'] = $checklistId;

        $question = Question::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Question ajoutée avec succès.',
            'data'    => $question,
        ], 201);
    }

    /**
     * Afficher une question spécifique.
     */
    public function show(int $id): JsonResponse
    {
        $question = Question::with('checklist:id,titre')->find($id);

        if (! $question) {
            return response()->json([
                'success' => false,
                'message' => 'Question non trouvée.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $question,
        ]);
    }

    /**
     * Mettre à jour une question existante.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // TODO : réactiver quand le système de login sera branché au frontend
        // $forbidden = $this->checkRole($request);
        // if ($forbidden) { return $forbidden; }

        $question = Question::find($id);

        if (! $question) {
            return response()->json([
                'success' => false,
                'message' => 'Question non trouvée.',
            ], 404);
        }

        $validated = $request->validate([
            'texte' => 'sometimes|required|string',
            'ordre' => 'nullable|integer',
        ]);

        $question->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Question mise à jour avec succès.',
            'data'    => $question,
        ]);
    }

    /**
     * Supprimer une question.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        // TODO : réactiver quand le système de login sera branché au frontend
        // $forbidden = $this->checkRole($request);
        // if ($forbidden) { return $forbidden; }

        $question = Question::find($id);

        if (! $question) {
            return response()->json([
                'success' => false,
                'message' => 'Question non trouvée.',
            ], 404);
        }

        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Question supprimée avec succès.',
        ]);
    }

    /**
     * Vérification temporaire du rôle (inline).
     * Seuls les utilisateurs « Responsable Qualité » ou « Admin » peuvent
     * effectuer des opérations d'écriture sur les questions.
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
