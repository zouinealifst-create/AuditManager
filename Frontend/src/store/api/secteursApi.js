
import { baseApi } from './baseApi'

export const secteursApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getSecteurs: build.query({
        query: () => ({ url: '/secteurs' }),
        transformResponse: (response) =>
            Array.isArray(response) ? response : response?.data ?? [],
        providesTags: [{ type: 'Secteur', id: 'LIST' }],
        keepUnusedDataFor: 3600,
        }),
    }),
    overrideExisting: false,
})

export const { useGetSecteursQuery } = secteursApi