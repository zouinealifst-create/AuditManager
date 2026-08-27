/**
 * entreprisesApi.js — Endpoints RTK Query pour le module Entreprise
 *
 * Routes backend vérifiées (routes/api.php) — apiResource sans auth :
 *   GET  /entreprises/{id}                        → détail
 *   PUT  /entreprises/{id}                        → mise à jour
 *   POST /entreprises/{entrepriseId}/secteurs      → sync secteurs
 *
 * Note : ENTREPRISE_ID = 1 (hardcodé côté frontend actuel, reproduit ici)
 *
 * Réponse backend : { success, data: { id, nom, ... } }
 */
import { baseApi } from './baseApi'

const ENTREPRISE_ID = 1

export const entreprisesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    /**
     * Récupère le profil de l'entreprise.
     */
    getEntreprise: build.query({
      query: () => ({ url: `/entreprises/${ENTREPRISE_ID}` }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Entreprise', id: ENTREPRISE_ID }],
      keepUnusedDataFor: 600, // 10 min — stable
    }),

    /**
     * Met à jour le profil de l'entreprise.
     * @param {object} data — champs à mettre à jour
     */
    updateEntreprise: build.mutation({
      query: (data) => ({
        url: `/entreprises/${ENTREPRISE_ID}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Entreprise', id: ENTREPRISE_ID }],
    }),

    /**
     * Synchronise les secteurs d'une entreprise.
     * Route : POST /entreprises/{entrepriseId}/secteurs
     * @param {number[]} secteur_ids — tableau des IDs de secteurs
     */
    syncSecteurs: build.mutation({
      query: (secteur_ids) => ({
        url: `/entreprises/${ENTREPRISE_ID}/secteurs`,
        method: 'POST',
        data: { secteur_ids },
      }),
      invalidatesTags: [
        { type: 'Entreprise', id: ENTREPRISE_ID },
        { type: 'Norme', id: 'LIST' },
      ],
    }),
  }),

  overrideExisting: false,
})

export const {
  useGetEntrepriseQuery,
  useUpdateEntrepriseMutation,
  useSyncSecteursMutation,
} = entreprisesApi
