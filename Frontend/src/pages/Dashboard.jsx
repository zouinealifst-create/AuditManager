import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Dashboard Admin</h2>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
            Déconnexion
            </button>
        </div>

        {user && (
            <div className="alert alert-info">
            Connecté en tant que : <strong>{user.name}</strong> ({user.role?.name})
            </div>
        )}
        </div>
    )
}

export default Dashboard