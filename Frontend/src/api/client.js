/**
 * Client HTTP Axios pour AuditManager.
 *
 * - baseURL : VITE_API_URL ou http://localhost:8000/api
 * - Intercepteur de requête : injecte automatiquement le Bearer token
 *   stocké dans localStorage sous la clé 'token'
 * - Intercepteur de réponse : nettoie le localStorage et redirige
 *   vers /login si le backend retourne 401
 */
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Injecte le token Bearer à chaque requête
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gestion globale des erreurs d'authentification
client.interceptors.response.use(
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

export default client
