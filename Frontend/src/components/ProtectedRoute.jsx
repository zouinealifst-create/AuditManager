import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

function ProtectedRoute({ children, permission }) {
    const { user, loading } = useAuth()
    const hasPermission = usePermission(permission)

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

    if (permission && !hasPermission) {
        return <Navigate to="/forbidden" />
    }

    return children
}

export default ProtectedRoute