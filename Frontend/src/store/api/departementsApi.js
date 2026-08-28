import { baseApi } from './baseApi'

export const departementsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDepartements: build.query({
      query: (params = {}) => ({ url: '/departements', params }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Departement', id })),
              { type: 'Departement', id: 'LIST' },
            ]
          : [{ type: 'Departement', id: 'LIST' }],
      keepUnusedDataFor: 600,
    }),

    getDepartement: build.query({
      query: (id) => ({ url: `/departements/${id}` }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Departement', id }],
      keepUnusedDataFor: 600,
    }),

    createDepartement: build.mutation({
      query: (data) => ({ url: '/departements', method: 'POST', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Departement', id: 'LIST' }],
    }),

    updateDepartement: build.mutation({
      query: ({ id, ...data }) => ({ url: `/departements/${id}`, method: 'PUT', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Departement', id },
        { type: 'Departement', id: 'LIST' },
      ],
    }),

    deleteDepartement: build.mutation({
      query: (id) => ({ url: `/departements/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Departement', id },
        { type: 'Departement', id: 'LIST' },
      ],
    }),
  }),

  overrideExisting: false,
})

export const {
  useGetDepartementsQuery,
  useGetDepartementQuery,
  useCreateDepartementMutation,
  useUpdateDepartementMutation,
  useDeleteDepartementMutation,
} = departementsApi