/**
 * auditsApi.js — Endpoints RTK Query pour le module Audit
 *
 * Routes backend vérifiées (routes/api.php) — toutes sous auth:sanctum :
 *   GET    /audits                          → liste paginée
 *   POST   /audits                          → création
 *   GET    /audits/{id}                     → détail
 *   PUT    /audits/{id}                     → mise à jour
 *   DELETE /audits/{id}                     → suppression
 *   PATCH  /audits/{id}/planifier           → brouillon → planifie
 *   PATCH  /audits/{id}/affecter-auditeur   → (non exposé côté frontend pour l'instant)
 *   PATCH  /audits/{id}/affecter-departement→ (non exposé côté frontend pour l'instant)
 *   PATCH  /audits/{id}/demarrer            → planifie → en_cours
 *   PATCH  /audits/{id}/cloturer            → termine → cloture
 *
 * Réponse backend : { success, data: { data: [], current_page, last_page, total, ... } }
 * Le transformResponse extrait toujours response.data pour simplifier la consommation.
 */
import { baseApi } from './baseApi'

export const auditsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // ── Lecture ──────────────────────────────────────────────────────────────

    /**
     * Liste paginée des audits avec filtres optionnels.
     * @param {{ statut?: string, departement_id?: number, page?: number }}
     */
    getAudits: build.query({
      query: ({ statut, departement_id, page = 1 } = {}) => {
        const params = { page }
        if (statut)          params.statut         = statut
        if (departement_id)  params.departement_id = departement_id
        return { url: '/audits', params }
      },
      // Extrait response.data (objet paginé : { data:[], current_page, last_page, total })
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Audit', id })),
              { type: 'Audit', id: 'LIST' },
            ]
          : [{ type: 'Audit', id: 'LIST' }],
      keepUnusedDataFor: 120, // 2 min — liste rafraîchie régulièrement
    }),

    /**
     * Détail d'un audit (avec ses relations : checklist, questions, norme, dept, auditeur).
     * @param {number} id
     */
    getAudit: build.query({
      query: (id) => ({ url: `/audits/${id}` }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Audit', id }],
      keepUnusedDataFor: 300, // 5 min — détail moins volatile
    }),

    // ── Mutations ─────────────────────────────────────────────────────────────

    /**
     * Crée un nouvel audit (statut initial : brouillon).
     * @param {{ checklist_ids: number[], titre: string, departement_id?: number, auditeur_id?: number, date_prevue?: string }}
     */
    createAudit: build.mutation({
      query: (data) => ({ url: '/audits', method: 'POST', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Audit', id: 'LIST' }],
    }),

    /**
     * Met à jour un audit (champs modifiables si brouillon : titre, checklist_ids).
     * @param {{ id: number, ...fields }}
     */
    updateAudit: build.mutation({
      query: ({ id, ...data }) => ({ url: `/audits/${id}`, method: 'PUT', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    /**
     * Supprime un audit.
     * @param {number} id
     */
    deleteAudit: build.mutation({
      query: (id) => ({ url: `/audits/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    /**
     * Planifie un audit : brouillon → planifie.
     * Paramètres requis : date_prevue, departement_id, auditeur_id.
     * @param {{ id: number, date_prevue: string, departement_id: number, auditeur_id: number }}
     */
    planifierAudit: build.mutation({
      query: ({ id, date_prevue, departement_id, auditeur_id }) => ({
        url: `/audits/${id}/planifier`,
        method: 'PATCH',
        data: { date_prevue, departement_id, auditeur_id },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    /**
     * Démarre un audit : planifie → en_cours.
     * Réservé à l'auditeur assigné.
     * @param {number} id
     */
    demarrerAudit: build.mutation({
      query: (id) => ({ url: `/audits/${id}/demarrer`, method: 'PATCH' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),

    /**
     * Clôture un audit : termine → cloture.
     * @param {number} id
     */
    cloturerAudit: build.mutation({
      query: (id) => ({ url: `/audits/${id}/cloturer`, method: 'PATCH' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),
  }),

  // Garantit que les endpoints ne sont pas re-définis si le module est chargé 2x
  overrideExisting: false,
})

// Hooks auto-générés par RTK Query
export const {
  useGetAuditsQuery,
  useGetAuditQuery,
  useCreateAuditMutation,
  useUpdateAuditMutation,
  useDeleteAuditMutation,
  usePlanifierAuditMutation,
  useDemarrerAuditMutation,
  useCloturerAuditMutation,
} = auditsApi
