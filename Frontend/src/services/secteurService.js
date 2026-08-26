import api from './api'

export const getSecteurs = async () => {
  const response = await api.get('/secteurs')
  return response.data
}