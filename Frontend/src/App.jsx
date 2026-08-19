import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Authentification/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
<<<<<<< HEAD
import Entreprises from './pages/Entreprises'
import EntrepriseForm from './pages/EntrepriseForm'
import ChecklistsListPage from './pages/ChecklistsListPage'
import ChecklistCreate from './pages/ChecklistCreate'
=======
import EntrepriseProfil from './pages/Entreprise/EntrepriseProfil'
>>>>>>> eae1fdacb82a33ce0f42b06f1ec3d47258780938

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checklists" element={<ChecklistsWrapper />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
