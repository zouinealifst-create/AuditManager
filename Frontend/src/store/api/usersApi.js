import { baseApi } from './baseApi'

export const usersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getUsers: build.query({
        query: (params = {}) => ({ url: '/users', params }),
        transformResponse: (response) => response.data,
        providesTags: (result) =>
            result
            ? [
                ...result.map(({ id }) => ({ type: 'User', id })),
                { type: 'User', id: 'LIST' },
                ]
            : [{ type: 'User', id: 'LIST' }],
        keepUnusedDataFor: 120,
        }),

        getUser: build.query({
        query: (id) => ({ url: `/users/${id}` }),
        transformResponse: (response) => response.data,
        providesTags: (_result, _error, id) => [{ type: 'User', id }],
        }),

        createUser: build.mutation({
        query: (data) => ({ url: '/users', method: 'POST', data }),
        transformResponse: (response) => response.data,
        invalidatesTags: [
            { type: 'User', id: 'LIST' },
            { type: 'Departement', id: 'LIST' }, // le responsable peut affecter un département
        ],
        }),

        updateUser: build.mutation({
        query: ({ id, ...data }) => ({ url: `/users/${id}`, method: 'PUT', data }),
        transformResponse: (response) => response.data,
        invalidatesTags: (_result, _error, { id }) => [
            { type: 'User', id },
            { type: 'User', id: 'LIST' },
            { type: 'Departement', id: 'LIST' },
        ],
        }),

        deleteUser: build.mutation({
        query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
        invalidatesTags: (_result, _error, id) => [
            { type: 'User', id },
            { type: 'User', id: 'LIST' },
            { type: 'Departement', id: 'LIST' },
        ],
        }),

        toggleUserStatut: build.mutation({
        query: (id) => ({ url: `/users/${id}/toggle-statut`, method: 'PATCH' }),
        transformResponse: (response) => response.data,
        invalidatesTags: (_result, _error, id) => [
            { type: 'User', id },
            { type: 'User', id: 'LIST' },
        ],
        }),
    }),

    overrideExisting: false,
})

export const {
    useGetUsersQuery,
    useGetUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useToggleUserStatutMutation,
} = usersApi