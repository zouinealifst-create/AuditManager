/**
 * store.js — Redux Store principal pour AuditManager
 *
 * Configure le store avec :
 *   - Le reducer et middleware RTK Query (baseApi)
 *   - Les slices métier (ajoutés ici au fur et à mesure des phases)
 *
 * Les endpoints RTK Query sont injectés dans baseApi par chaque fichier
 * *Api.js (auditsApi, checklistsApi, etc.) via .injectEndpoints().
 * Il suffit d'importer ces fichiers une seule fois ici pour les enregistrer.
 */
import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'

// Importer chaque slice d'API pour enregistrer ses endpoints dans baseApi
// (l'import suffit — les endpoints s'injectent au chargement du module)
import './api/auditsApi'
import './api/checklistsApi'
import './api/departementsApi'
import './api/normesApi'
import './api/entreprisesApi'

export const store = configureStore({
  reducer: {
    // Reducer RTK Query (clé = baseApi.reducerPath = 'api')
    [baseApi.reducerPath]: baseApi.reducer,

    // Slices métier — Phase 3 (auth, etc.) ajoutés ici
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // Middleware RTK Query : gère le cache, les invalidations, le polling
      baseApi.middleware
    ),

  // Activation des Redux DevTools (automatique en développement)
  // Les DevTools afficheront toutes les requêtes RTK Query sous l'onglet "api"
  devTools: import.meta.env.DEV,
})
