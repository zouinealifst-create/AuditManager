import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'

import './api/auditsApi'
import './api/checklistsApi'
import './api/departementsApi'
import './api/normesApi'
import './api/entreprisesApi'
import './api/usersApi'
import './api/rolesApi'
import './api/secteursApi'
import './api/nonConformitesApi'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
})