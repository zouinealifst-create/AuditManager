import { createApi } from '@reduxjs/toolkit/query/react'
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: 300,
  tagTypes: ['Audit', 'Checklist', 'Departement', 'Norme', 'Question', 'Entreprise', 'User', 'Role', 'Secteur', 'Permission'],
  endpoints: () => ({}),
})