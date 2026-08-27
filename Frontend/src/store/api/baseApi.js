/**
 * baseApi.js — RTK Query base API pour AuditManager
 *
 * Utilise un axiosBaseQuery custom qui :
 *   - Réutilise le même client Axios que src/api/client.js
 *     (Bearer token auto + redirect 401)
 *   - Expose un keepUnusedDataFor configurable par endpoint
 *
 * Usage dans chaque slice :
 *   import { baseApi } from './baseApi'
 *   export const myApi = baseApi.injectEndpoints({ endpoints: (build) => ({ ... }) })
 */
import { createApi } from '@reduxjs/toolkit/query/react'
import axios from 'axios'

// ── Axios instance partagée ───────────────────────────────────────────────────
// On recrée une instance propre au lieu d'importer src/api/client.js
// pour éviter les cycles de dépendances entre le store et les anciens modules.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Injecte le Bearer token à chaque requête
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gestion globale 401 → nettoyage + redirect login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── axiosBaseQuery ────────────────────────────────────────────────────────────
// Adapte Axios au format attendu par RTK Query :
// { data } en succès ou { error: { status, data } } en échec
const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await axiosInstance({ url, method, data, params })
      return { data: result.data }
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data ?? axiosError.message,
        },
      }
    }
  }

// ── API de base ───────────────────────────────────────────────────────────────
// Tous les slices RTK Query injectent leurs endpoints ici via .injectEndpoints()
// keepUnusedDataFor : durée (secondes) de conservation du cache après le dernier abonné
//   → configurable par endpoint avec keepUnusedDataFor dans chaque build.query()
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: 300, // 5 min par défaut — remplacé par endpoint si besoin
  tagTypes: ['Audit', 'Checklist', 'Departement', 'Norme', 'Question', 'Entreprise'],
  endpoints: () => ({}), // les endpoints sont injectés par chaque slice
})
