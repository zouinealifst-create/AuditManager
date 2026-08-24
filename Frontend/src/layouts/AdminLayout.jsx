import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './AdminLayout.css'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/entreprise': 'Mon entreprise',
  '/departements': 'Départements',
  '/users': 'Utilisateurs',
  '/roles': 'Rôles',
}

function AdminLayout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'AuditFlow'

  return (
    <div className="admin-layout d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1">
        <Topbar title={title} />
        <div className="page-content p-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout