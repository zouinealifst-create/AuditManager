/**
 * checklistsApi.js — Endpoints RTK Query pour le module Checklist
 *
 * Routes backend vérifiées (routes/api.php) — apiResource sans auth (dev) :
 *   GET    /checklists                          → liste paginée
 *   POST   /checklists                          → création
 *   GET    /checklists/{id}                     → détail
 *   PUT    /checklists/{id}                     → mise à jour
 *   DELETE /checklists/{id}                     → suppression
 *
 * Routes Questions (shallow) — vérifiées :
 *   POST   /checklists/{checklistId}/questions  → ajout d'une question
 *   PUT    /questions/{questionId}              → mise à jour (route shallow)
 *   DELETE /questions/{questionId}              → suppression (route shallow)
 *
 * Réponse backend liste : { success, data: { data:[], current_page, last_page, total } }
 * Réponse backend détail : { success, data: { id, titre, ... , questions:[] } }
 */
import { baseApi } from './baseApi'

export const checklistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // ── Lecture ──────────────────────────────────────────────────────────────

    /**
     * Liste paginée des checklists avec filtres optionnels.
     * @param {{ statut?: string, norme_id?: number, page?: number }}
     */
    listChecklists: build.query({
      query: ({ statut, norme_id, page = 1 } = {}) => {
        const params = { page }
        if (statut)   params.statut   = statut
        if (norme_id) params.norme_id = norme_id
        return { url: '/checklists', params }
      },
      // Retourne l'objet paginé complet : { data:[], current_page, last_page, total }
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Checklist', id })),
              { type: 'Checklist', id: 'LIST' },
            ]
          : [{ type: 'Checklist', id: 'LIST' }],
      keepUnusedDataFor: 180, // 3 min
    }),

    /**
     * Checklists actives uniquement (pour sélection lors de la création d'un audit).
     * @param {number|null} departement_id — filtrage optionnel par département
     */
    listChecklistsActives: build.query({
      query: (departement_id = null) => {
        const params = { statut: 'actif', page: 1 }
        if (departement_id) params.departement_id = departement_id
        return { url: '/checklists', params }
      },
      // Retourne directement le tableau (data.data)
      transformResponse: (response) => response.data?.data ?? [],
      providesTags: [{ type: 'Checklist', id: 'ACTIVES' }],
      keepUnusedDataFor: 300, // 5 min — données stables
    }),

    /**
     * Détail d'une checklist avec ses questions.
     * @param {number} id
     */
    getChecklist: build.query({
      query: (id) => ({ url: `/checklists/${id}` }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [
        { type: 'Checklist', id },
        { type: 'Question', id: `CHECKLIST-${id}` },
      ],
      keepUnusedDataFor: 300,
    }),

    // ── Mutations Checklists ──────────────────────────────────────────────────

    /**
     * Crée une checklist en brouillon.
     * @param {{ norme_id: number, titre: string, description?: string, statut?: string }}
     */
    createChecklist: build.mutation({
      query: (data) => ({
        url: '/checklists',
        method: 'POST',
        data: {
          norme_id:    data.norme_id,
          titre:       data.titre,
          description: data.description ?? null,
          statut:      data.statut ?? 'brouillon',
        },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Checklist', id: 'LIST' }],
    }),

    /**
     * Met à jour une checklist.
     * @param {{ id: number, ...fields }}
     */
    updateChecklist: build.mutation({
      query: ({ id, ...data }) => ({ url: `/checklists/${id}`, method: 'PUT', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Checklist', id },
        { type: 'Checklist', id: 'LIST' },
      ],
    }),

    /**
     * Supprime une checklist.
     * @param {number} id
     */
    deleteChecklist: build.mutation({
      query: (id) => ({ url: `/checklists/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Checklist', id },
        { type: 'Checklist', id: 'LIST' },
      ],
    }),

    /**
     * Publie une checklist (statut → 'actif').
     * Utilise PUT /checklists/{id} avec { statut: 'actif' }.
     * @param {number} id
     */
    publierChecklist: build.mutation({
      query: (id) => ({
        url: `/checklists/${id}`,
        method: 'PUT',
        data: { statut: 'actif' },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Checklist', id },
        { type: 'Checklist', id: 'LIST' },
        { type: 'Checklist', id: 'ACTIVES' },
      ],
    }),

    // ── Mutations Questions (routes shallow vérifiées) ────────────────────────

    /**
     * Ajoute une question à une checklist.
     * Route : POST /checklists/{checklistId}/questions
     * @param {{ checklistId: number, texte: string, ordre?: number }}
     */
    addQuestion: build.mutation({
      query: ({ checklistId, texte, ordre }) => ({
        url: `/checklists/${checklistId}/questions`,
        method: 'POST',
        data: { texte, ordre },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { checklistId }) => [
        { type: 'Checklist', id: checklistId },
        { type: 'Question', id: `CHECKLIST-${checklistId}` },
      ],
    }),

    /**
     * Met à jour une question existante.
     * Route shallow : PUT /questions/{questionId}
     * @param {{ checklistId: number, questionId: number, texte: string }}
     */
    updateQuestion: build.mutation({
      query: ({ questionId, texte }) => ({
        url: `/questions/${questionId}`,
        method: 'PUT',
        data: { texte },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { checklistId }) => [
        { type: 'Checklist', id: checklistId },
        { type: 'Question', id: `CHECKLIST-${checklistId}` },
      ],
    }),

    /**
     * Supprime une question.
     * Route shallow : DELETE /questions/{questionId}
     * @param {{ checklistId: number, questionId: number }}
     */
    deleteQuestion: build.mutation({
      query: ({ questionId }) => ({
        url: `/questions/${questionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { checklistId }) => [
        { type: 'Checklist', id: checklistId },
        { type: 'Question', id: `CHECKLIST-${checklistId}` },
      ],
    }),
  }),

  overrideExisting: false,
})

export const {
  useListChecklistsQuery,
  useListChecklistsActivesQuery,
  useGetChecklistQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useDeleteChecklistMutation,
  usePublierChecklistMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = checklistsApi
