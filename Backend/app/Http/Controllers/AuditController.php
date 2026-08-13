<?php

namespace App\Http\Controllers;

use App\Models\Audit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    // ──────────────────────────────────────────────────────────────────────────
    // CRUD DE BASE
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Lister les audits.
     * Filtres optionnels : ?statut= et ?departement_id=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Audit::with([
            'checklist:id,titre,norme_id',
            'checklist.norme:id,code,nom',
            'departement:id,nom',
            'auditeur:id,name',
            'responsableQualite:id,name',
        ]);

        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }

        if ($request->filled('departement_id')) {
            $query->where('departement_id', $request->input('departement_id'));
        }

        $audits = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $audits,
        ]);
    }

    /**
     * Créer un nouvel audit (statut initial : brouillon).
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
            'checklist_id'   => 'required|integer|exists:checklists,id',
            'titre'          => 'required|string|max:255',
            'departement_id' => 'nullable|integer|exists:departements,id',
            'auditeur_id'    => 'nullable|integer|exists:users,id',
            'date_prevue'    => 'nullable|date',
        ]);

        $validated['responsable_qualite_id'] = $request->user()->id;
        $validated['statut'] = 'brouillon';

        $audit = Audit::create($validated);
        $audit->load([
            'checklist:id,titre,norme_id',
            'checklist.norme:id,code,nom',
            'departement:id,nom',
            'auditeur:id,name',
            'responsableQualite:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Audit créé avec succès.',
            'data'    => $audit,
        ], 201);
    }

    /**
     * Afficher un audit avec toutes ses relations.
     */
    public function show(int $id): JsonResponse
    {
        $audit = Audit::with([
            'checklist:id,titre,norme_id',
            'checklist.norme:id,code,nom',
            'checklist.questions',
            'departement:id,nom',
            'auditeur:id,name',
            'responsableQualite:id,name',
        ])->find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $audit,
        ]);
    }

    /**
     * Modifier les champs de base d'un audit.
     * Interdit si le statut n'est plus 'brouillon' (la planification a déjà commencé).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        // Bloquer toute modification du titre ou de la checklist une fois sorti du brouillon
        if ($audit->statut !== 'brouillon' &&
            ($request->has('titre') || $request->has('checklist_id'))) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier le titre ou la checklist après le démarrage de la planification.',
            ], 422);
        }

        $validated = $request->validate([
            'checklist_id'   => 'sometimes|required|integer|exists:checklists,id',
            'titre'          => 'sometimes|required|string|max:255',
            'departement_id' => 'nullable|integer|exists:departements,id',
            'auditeur_id'    => 'nullable|integer|exists:users,id',
            'date_prevue'    => 'nullable|date',
        ]);

        $audit->update($validated);
        $audit->load([
            'checklist:id,titre,norme_id',
            'checklist.norme:id,code,nom',
            'departement:id,nom',
            'auditeur:id,name',
            'responsableQualite:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Audit mis à jour avec succès.',
            'data'    => $audit,
        ]);
    }

    /**
     * Supprimer un audit.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        $audit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Audit supprimé avec succès.',
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACTIONS MÉTIER (TRANSITIONS DE STATUT)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Planifier un audit : passe de 'brouillon' → 'planifie'.
     * Oblige la saisie d'une date prévue, d'un département et d'un auditeur.
     */
    public function planifier(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        if ($audit->statut !== 'brouillon') {
            return response()->json([
                'success' => false,
                'message' => 'Transition invalide : l\'audit doit être au statut "brouillon" pour être planifié.',
            ], 422);
        }

        $validated = $request->validate([
            'date_prevue'    => 'required|date',
            'departement_id' => 'required|integer|exists:departements,id',
            'auditeur_id'    => 'required|integer|exists:users,id',
        ]);

        // Vérification optionnelle que l'utilisateur assigné a bien le rôle "Auditeur"
        $auditeur = User::find($validated['auditeur_id']);
        if ($auditeur && $auditeur->role?->name !== 'Auditeur') {
            return response()->json([
                'success' => false,
                'message' => 'L\'utilisateur désigné n\'a pas le rôle "Auditeur".',
            ], 422);
        }

        $audit->update(array_merge($validated, ['statut' => 'planifie']));
        $audit->load([
            'checklist:id,titre,norme_id',
            'checklist.norme:id,code,nom',
            'departement:id,nom',
            'auditeur:id,name',
            'responsableQualite:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Audit planifié avec succès.',
            'data'    => $audit,
        ]);
    }

    /**
     * Affecter (ou changer) l'auditeur d'un audit, sans changer le statut.
     */
    public function affecterAuditeur(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        $validated = $request->validate([
            'auditeur_id' => 'required|integer|exists:users,id',
        ]);

        // Vérification que l'utilisateur assigné a bien le rôle "Auditeur"
        $auditeur = User::find($validated['auditeur_id']);
        if ($auditeur && $auditeur->role?->name !== 'Auditeur') {
            return response()->json([
                'success' => false,
                'message' => 'L\'utilisateur désigné n\'a pas le rôle "Auditeur".',
            ], 422);
        }

        $audit->update(['auditeur_id' => $validated['auditeur_id']]);
        $audit->load('auditeur:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Auditeur affecté avec succès.',
            'data'    => $audit,
        ]);
    }

    /**
     * Affecter (ou changer) le département d'un audit, sans changer le statut.
     */
    public function affecterDepartement(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        $validated = $request->validate([
            'departement_id' => 'required|integer|exists:departements,id',
        ]);

        $audit->update(['departement_id' => $validated['departement_id']]);
        $audit->load('departement:id,nom');

        return response()->json([
            'success' => true,
            'message' => 'Département affecté avec succès.',
            'data'    => $audit,
        ]);
    }

    /**
     * Démarrer un audit : passe de 'planifie' → 'en_cours'.
     * Réservé à l'auditeur assigné ou à un Admin.
     */
    public function demarrer(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        // Seul l'auditeur assigné à cet audit, ou un Admin, peut le démarrer
        if ($user->id !== $audit->auditeur_id && $user->role?->name !== 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée : seul l\'auditeur assigné ou un Admin peut démarrer cet audit.',
            ], 403);
        }

        if ($audit->statut !== 'planifie') {
            return response()->json([
                'success' => false,
                'message' => 'Transition invalide : l\'audit doit être au statut "planifie" pour être démarré.',
            ], 422);
        }

        $audit->update(['statut' => 'en_cours']);

        return response()->json([
            'success' => true,
            'message' => 'Audit démarré avec succès.',
            'data'    => $audit,
        ]);
    }

    /**
     * Clôturer un audit : passe de 'termine' → 'cloture'.
     * Réservé au Responsable Qualité ou Admin.
     * Le statut 'termine' est positionné par le module d'exécution de Dev 3.
     */
    public function cloturer(Request $request, int $id): JsonResponse
    {
        // Vérification temporaire du rôle en ligne.
        // À remplacer par un middleware dédié lorsque Dev 1 livrera le système de permissions.
        $forbidden = $this->checkRole($request);
        if ($forbidden) {
            return $forbidden;
        }

        $audit = Audit::find($id);

        if (! $audit) {
            return response()->json([
                'success' => false,
                'message' => 'Audit non trouvé.',
            ], 404);
        }

        if ($audit->statut !== 'termine') {
            return response()->json([
                'success' => false,
                'message' => 'Transition invalide : l\'audit doit être au statut "termine" avant d\'être clôturé. L\'auditeur doit d\'abord compléter toutes les réponses.',
            ], 422);
        }

        $audit->update([
            'statut'           => 'cloture',
            'date_realisation' => $audit->date_realisation ?? now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Audit clôturé avec succès.',
            'data'    => $audit,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HELPERS PRIVÉS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Vérification temporaire du rôle (inline).
     * Seuls les utilisateurs « Responsable Qualité » ou « Admin » peuvent
     * effectuer des opérations d'écriture sur les audits.
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
