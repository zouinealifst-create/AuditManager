/**
 * nonConformitesApi.js — Endpoints RTK Query pour le module Non-conformités
 */
import { baseApi } from './baseApi'

export const nonConformitesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Lecture ──────────────────────────────────────────────────────────────

    /**
     * Liste des non-conformités avec filtres optionnels.
     * @param {{ statut?: string, gravite?: string, responsable_id?: number }}
     */
    getNonConformites: build.query({
      query: (params = {}) => ({ url: '/non-conformites', params }),
      transformResponse: (response) => response, // L'API renvoie directement un tableau
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'NonConformite', id })),
              { type: 'NonConformite', id: 'LIST' },
            ]
          : [{ type: 'NonConformite', id: 'LIST' }],
      keepUnusedDataFor: 120,
    }),

    /**
     * Détail d'une non-conformité.
     * @param {number} id
     */
    getNonConformite: build.query({
      query: (id) => ({ url: `/non-conformites/${id}` }),
      transformResponse: (response) => response,
      providesTags: (_result, _error, id) => [{ type: 'NonConformite', id }],
      keepUnusedDataFor: 300,
    }),

    // ── Mutations ─────────────────────────────────────────────────────────────

    createNonConformite: build.mutation({
      query: (data) => ({ url: '/non-conformites', method: 'POST', data }),
      invalidatesTags: [{ type: 'NonConformite', id: 'LIST' }],
    }),

    updateNonConformite: build.mutation({
      query: ({ id, ...data }) => ({ url: `/non-conformites/${id}`, method: 'PUT', data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NonConformite', id },
        { type: 'NonConformite', id: 'LIST' },
      ],
    }),

    deleteNonConformite: build.mutation({
      query: (id) => ({ url: `/non-conformites/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NonConformite', id },
        { type: 'NonConformite', id: 'LIST' },
      ],
    }),
  }),

  overrideExisting: false,
})

export const {
  useGetNonConformitesQuery,
  useGetNonConformiteQuery,
  useCreateNonConformiteMutation,
  useUpdateNonConformiteMutation,
  useDeleteNonConformiteMutation,
} = nonConformitesApi
