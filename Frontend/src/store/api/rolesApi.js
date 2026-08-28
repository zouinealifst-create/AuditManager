
import { baseApi } from './baseApi'

export const rolesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getRoles: build.query({
        query: () => ({ url: '/roles' }),
        transformResponse: (response) =>
            Array.isArray(response) ? response : response?.data ?? [],
        providesTags: [{ type: 'Role', id: 'LIST' }],
        keepUnusedDataFor: 3600, // 1h — quasi statique
        }),
    }),
    overrideExisting: false,
})

export const { useGetRolesQuery } = rolesApi