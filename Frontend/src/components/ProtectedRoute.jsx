import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="spinner-border text-primary" role="status" />
        </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    return children
}

export default ProtectedRoute