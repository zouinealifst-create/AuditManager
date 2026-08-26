import api from './api'

export const getDepartements = async (params = {}) => {
  const response = await api.get('/departements', { params })
  return response.data
}

export const getDepartement = async (id) => {
  const response = await api.get(`/departements/${id}`)
  return response.data
}

export const createDepartement = async (data) => {
  const response = await api.post('/departements', data)
  return response.data
}

export const updateDepartement = async (id, data) => {
  const response = await api.put(`/departements/${id}`, data)
  return response.data
}

export const deleteDepartement = async (id) => {
  const response = await api.delete(`/departements/${id}`)
  return response.data
}