/**
 * normesApi.js — Endpoints RTK Query pour le module Norme
 *
 * Routes backend vérifiées (routes/api.php) — apiResource sans auth :
 *   GET    /normes                → liste (filtrable par secteur_id)
 *   POST   /normes                → création
 *   GET    /normes/{id}           → détail
 *   PUT    /normes/{id}           → mise à jour
 *   DELETE /normes/{id}           → suppression
 *
 * Paramètres de filtrage :
 *   secteur_id → retourne les normes actives du secteur + les normes universelles
 *   (sans paramètre → toutes les normes, usage admin)
 *
 * Réponse backend : { success: true, data: [...] }
 */
import { baseApi } from './baseApi'

export const normesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    /**
     * Normes applicables à un secteur donné (inclut les universelles).
     * @param {number} secteurId — ID du secteur du département sélectionné
     * Retourne : [{ id, code, nom, description, statut, est_universelle }]
     */
    getNormesParSecteur: build.query({
      query: (secteurId) => ({
        url: '/normes',
        params: { secteur_id: secteurId },
      }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, secteurId) => [
        { type: 'Norme', id: `SECTEUR-${secteurId}` },
      ],
      keepUnusedDataFor: 600, // 10 min — catalogue stable
    }),

    /**
     * Toutes les normes du catalogue (sans filtre secteur).
     * Usage : administration uniquement.
     * Retourne : [{ id, code, nom, description, statut, est_universelle }]
     */
    getAllNormes: build.query({
      query: () => ({ url: '/normes' }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Norme', id: 'LIST' }],
      keepUnusedDataFor: 600,
    }),
  }),

  overrideExisting: false,
})

export const {
  useGetNormesParSecteurQuery,
  useGetAllNormesQuery,
} = normesApi
