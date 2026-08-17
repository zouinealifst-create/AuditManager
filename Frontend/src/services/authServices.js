import api from './api'

export const login = async (email, password) => {
    const response = await api.post('/login', { email, password })
    return response.data
}

export const logout = async () => {
    await api.post('/logout')
}

export const getMe = async () => {
    const response = await api.get('/me')
    return response.data
}