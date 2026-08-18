import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './AdminLayout.css'

function AdminLayout({ title }) {
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