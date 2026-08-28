import { baseApi } from './baseApi'

const ENTREPRISE_ID = 1

export const entreprisesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getEntreprise: build.query({
      query: () => ({ url: `/entreprises/${ENTREPRISE_ID}` }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Entreprise', id: ENTREPRISE_ID }],
      keepUnusedDataFor: 600,
    }),

    updateEntreprise: build.mutation({
      query: (data) => {
        const formData = new FormData()
        Object.keys(data).forEach((key) => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key])
          }
        })
        formData.append('_method', 'PUT')
        return {
          url: `/entreprises/${ENTREPRISE_ID}`,
          method: 'POST',
          data: formData,
        }
      },
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Entreprise', id: ENTREPRISE_ID }],
    }),

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