import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Authentification/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import EntrepriseProfil from './pages/Entreprise/EntrepriseProfil'
import ChecklistsListPage from './pages/Checklist/ChecklistsListPage'
import Departements from './pages/Departement/Departements'
import Users from './pages/Utilisateur/Users'
import AuditsListPage from './pages/Audit/AuditsListPage'
import Profil from './pages/Profil/Profil'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout title="Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route path="/entreprise" element={<EntrepriseProfil />} />
          <Route path="/departements" element={<Departements />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profil" element={<Profil />} />

          
          {/* ── Module Checklists ── */}
          <Route path="/checklists" element={<ChecklistsListPage />} />

          {/* ── Module Audit ── */}
          <Route path="/audits" element={<AuditsListPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}