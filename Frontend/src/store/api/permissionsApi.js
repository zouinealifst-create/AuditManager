import { baseApi } from './baseApi'

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: () => ({ url: '/permissions' }),
      providesTags: ['Permission'],
    }),
  }),
})

export const {
  useGetPermissionsQuery,
} = permissionsApi
