import api from './api'

const ENTREPRISE_ID = 1

export const getEntreprise = async () => {
    const response = await api.get(`/entreprises/${ENTREPRISE_ID}`)
    return response.data
}

export const updateEntreprise = async (data) => {
    const response = await api.put(`/entreprises/${ENTREPRISE_ID}`, data)
    return response.data
}