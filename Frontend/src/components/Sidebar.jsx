import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../context/AuthContext'

import {
    faHouse,
    faBuilding,
    faSitemap,
    faUsers,
    faClipboardList,
    faClipboardCheck,
    faRightFromBracket,
    faUserShield,
    faChartLine
} from '@fortawesome/free-solid-svg-icons'

function Sidebar() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: faHouse },
        { path: '/dashboard-rq', label: 'Dashboard RQ', icon: faChartLine },
        { path: '/entreprise', label: 'Mon entreprise', icon: faBuilding },
        { path: '/departements', label: 'Départements', icon: faSitemap },
        { path: '/users', label: 'Utilisateurs', icon: faUsers },
        { path: '/checklists', label: 'Checklists', icon: faClipboardList },
        { path: '/audits', label: 'Historique des audits', icon: faClipboardCheck },
    ]

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="sidebar d-flex flex-column">
        <div className="sidebar-header">
            <h5 className="mb-0">AuditManager</h5>
        </div>

        <nav className="flex-grow-1">
            {/* Navigation principale */}
            {menuItems.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
                }
            >
                <FontAwesomeIcon icon={item.icon} className="me-2" />
                {item.label}
            </NavLink>
            ))}
        </nav>

        {/* Déconnexion — toujours ancrée en bas de la sidebar */}
        <button className="sidebar-logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="me-2" />
            Se déconnecter
        </button>
        </div>
    )
}

export default Sidebar