import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Authentification/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import EntrepriseProfil from './pages/Entreprise/EntrepriseProfil'
import ChecklistsListPage from './pages/Checklist/ChecklistsListPage'
import ChecklistCreate from './pages/Checklist/ChecklistCreate'
import Departements from './pages/Departement/Departements'
import Users from './pages/Utilisateur/Users'



function ChecklistsWrapper() {
  const [view, setView] = useState('list')
  if (view === 'create') {
    return <ChecklistCreate onCreated={() => setView('list')} onCancel={() => setView('list')} />
  }
  return <ChecklistsListPage onNew={() => setView('create')} />
}

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
          <Route path="/checklists" element={<ChecklistsWrapper />} />
          <Route path="/users" element={<Users />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}