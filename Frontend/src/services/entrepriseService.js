import api from './api'

export const getEntreprises = async (page = 1) => {
    const response = await api.get(`/entreprises?page=${page}`)
    return response.data
}

export const getEntreprise = async (id) => {
    const response = await api.get(`/entreprises/${id}`)
    return response.data
}

export const createEntreprise = async (data) => {
    const response = await api.post('/entreprises', data)
    return response.data
}

export const updateEntreprise = async (id, data) => {
    const response = await api.put(`/entreprises/${id}`, data)
    return response.data
}

export const deleteEntreprise = async (id) => {
    const response = await api.delete(`/entreprises/${id}`)
    return response.data
}