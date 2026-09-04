import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

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
        { path: '/dashboard', label: 'Dashboard admin', icon: faChartLine, permission: 'dashboard.view' },
        { path: '/dashboard-rq', label: 'Dashboard RQ', icon: faChartLine, permission: 'dashboard_rq.view' },
        { path: '/entreprise', label: 'Mon entreprise', icon: faBuilding, permission: 'entreprise.view' },
        { path: '/departements', label: 'Départements', icon: faSitemap, permission: 'departements.view' },
        { path: '/users', label: 'Utilisateurs', icon: faUsers, permission: 'users.view' },
        { path: '/roles', label: 'Rôles', icon: faUserShield, permission: 'users.view' },
        { path: '/checklists', label: 'Checklists', icon: faClipboardList, permission: 'checklists.view' },
        { path: '/audits', label: 'Historique des audits', icon: faClipboardCheck, permission: 'audits.view' },
    ]

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const SidebarLink = ({ item }) => {
        const hasPermission = usePermission(item.permission)
        if (!hasPermission) return null

        return (
            <NavLink
                to={item.path}
                className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                }
            >
                <FontAwesomeIcon icon={item.icon} className="me-2" />
                {item.label}
            </NavLink>
        )
    }

    return (
        <div className="sidebar d-flex flex-column">
            <div className="sidebar-header">
                <h5 className="mb-0">AuditManager</h5>
            </div>

            <nav className="flex-grow-1">
                {menuItems.map((item) => (
                    <SidebarLink key={item.path} item={item} />
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