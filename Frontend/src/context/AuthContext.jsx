import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, getMe } from '../services/authServices'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (token) {
        getMe()
            .then((data) => setUser(data.data))
            .catch(() => {
            localStorage.removeItem('token')
            setUser(null)
            })
            .finally(() => setLoading(false))
        } else {
        setLoading(false)
        }
    }, [])

    const login = async (email, password) => {
        const data = await loginService(email, password)
        localStorage.setItem('token', data.token)
        setUser(data.user)
        return data.user
    }

    const logout = async () => {
        await logoutService()
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}