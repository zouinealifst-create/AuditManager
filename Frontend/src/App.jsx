import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Authentification/Login'

import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import EntrepriseProfil from './pages/Entreprise/EntrepriseProfil'
import ChecklistsListPage from './pages/Checklist/ChecklistsListPage'
import Departements from './pages/Departement/Departements'
import Users from './pages/Utilisateur/Users'
import AuditsListPage from './pages/Audit/AuditsListPage'
import Profil from './pages/Profil/Profil'
import Dashboard from './pages/Dashboard/Dashboard'
import ResponsableQualiteDashboard from './pages/Dashboard/ResponsableQualiteDashboard'
import Forbidden from './pages/Forbidden'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forbidden" element={<Forbidden />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout title="Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route path="/entreprise" element={<ProtectedRoute permission="entreprise.view"><EntrepriseProfil /></ProtectedRoute>} />
          <Route path="/departements" element={<ProtectedRoute permission="departements.view"><Departements /></ProtectedRoute>} />
          <Route path="/dashboard-rq" element={<ProtectedRoute permission="dashboard_rq.view"><ResponsableQualiteDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/dashboard" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute permission="checklists.view"><ChecklistsListPage /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute permission="audits.view"><AuditsListPage /></ProtectedRoute>} />
        </Route >

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes >
    </BrowserRouter >
  )
}