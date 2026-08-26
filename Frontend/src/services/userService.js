import api from './api'

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params })
  return response.data
}

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

export const createUser = async (data) => {
  const response = await api.post('/users', data)
  return response.data
}

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

export const toggleUserStatut = async (id) => {
  const response = await api.patch(`/users/${id}/toggle-statut`)
  return response.data
}