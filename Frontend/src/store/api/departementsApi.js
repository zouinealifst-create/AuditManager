/**
 * departementsApi.js — Endpoints RTK Query pour le module Département
 *
 * Routes backend vérifiées (routes/api.php) — apiResource sans auth :
 *   GET    /departements          → liste paginée
 *   POST   /departements          → création
 *   GET    /departements/{id}     → détail
 *   PUT    /departements/{id}     → mise à jour
 *   DELETE /departements/{id}     → suppression
 *
 * Réponse backend : { data: [...], links: {...}, meta: {...} }
 * (Laravel Resource Collection — structure différente des autres endpoints)
 */
import { baseApi } from './baseApi'

export const departementsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    /**
     * Liste de tous les départements (page 1, pas de pagination custom pour l'instant).
     * Retourne un tableau de départements :
     *   { id, nom, description, secteur_id, secteur: { id, nom } }
     */
    getDepartements: build.query({
      query: () => ({ url: '/departements' }),
      // Laravel Resource Collection → response.data est le tableau
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Departement', id })),
              { type: 'Departement', id: 'LIST' },
            ]
          : [{ type: 'Departement', id: 'LIST' }],
      keepUnusedDataFor: 600, // 10 min — très stable, rarement modifié
    }),

    /**
     * Détail d'un département.
     * @param {number} id
     */
    getDepartement: build.query({
      query: (id) => ({ url: `/departements/${id}` }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Departement', id }],
      keepUnusedDataFor: 600,
    }),
  }),

  overrideExisting: false,
})

export const {
  useGetDepartementsQuery,
  useGetDepartementQuery,
} = departementsApi
