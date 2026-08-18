import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

function Topbar({ title }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="topbar d-flex align-items-center justify-content-between px-4">
        <h5 className="mb-0">{title}</h5>

        <div className="d-flex align-items-center gap-3">
            <span className="text-muted">{user?.name}</span>
            <div className="dropdown">
            <button className="btn btn-light rounded-circle" data-bs-toggle="dropdown">
                <FontAwesomeIcon icon={faCircleUser} className="fs-5" />
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
                <li>
                <button className="dropdown-item" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} className="me-2" />
                    Déconnexion
                </button>
                </li>
            </ul>
            </div>
        </div>
        </div>
    )
}

export default Topbar