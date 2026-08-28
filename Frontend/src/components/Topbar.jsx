import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'

function Topbar({ title }) {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="topbar d-flex align-items-center justify-content-between px-4">
            <h5 className="mb-0">{title}</h5>

            <div className="d-flex align-items-center gap-3">
                <span className="text-muted d-none d-md-inline">{user?.name}</span>

                <button
                    className="topbar-avatar-btn"
                    onClick={() => navigate('/profil')}
                    title="Voir mon profil"
                    aria-label="Voir mon profil"
                >
                    <FontAwesomeIcon icon={faCircleUser} />
                </button>
            </div>
        </div>
    )
}

export default Topbar