import api from './api'

const ENTREPRISE_ID = 1

export const getEntreprise = async () => {
    const response = await api.get(`/entreprises/${ENTREPRISE_ID}`)
    return response.data
}

export const updateEntreprise = async (data) => {
    const formData = new FormData()

    Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
        }
    })

    formData.append('_method', 'PUT')

    const response = await api.post(`/entreprises/${ENTREPRISE_ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
  return response.data
}