import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faPen, faTrash, faFolder, faFolderOpen,
  faChevronLeft, faChevronRight, faUserShield, faPowerOff,
} from '@fortawesome/free-solid-svg-icons'
import { AnimatePresence } from 'framer-motion'
import { getUsers, deleteUser, toggleUserStatut } from '../../services/userService'
import UserForm from '../../components/UserForm'
import './Users.css'

const ROLE_COLORS = {
  'Admin': 'us-badge-admin',
  'Responsable Qualité': 'us-badge-rq',
  'Auditeur': 'us-badge-audit',
  'Responsable Département': 'us-badge-rd',
}

function Users() {
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeFilter, setActiveFilter] = useState({ type: 'all' })
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers({ per_page: 100 })
      setAllUsers(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // ── Groupement par rôle ──
  const groups = useMemo(() => {
    const map = new Map()
    allUsers.forEach((u) => {
      const key = u.role ? u.role.id : 'none'
      if (!map.has(key)) {
        map.set(key, { id: key, nom: u.role ? u.role.name : 'Sans rôle', users: [] })
      }
      map.get(key).users.push(u)
    })
    return Array.from(map.values())
  }, [allUsers])

  const filteredList = useMemo(() => {
    if (activeFilter.type === 'role') {
      return allUsers.filter((u) => (u.role ? u.role.id : 'none') === activeFilter.id)
    }
    return allUsers
  }, [allUsers, activeFilter])

  const currentTitle = useMemo(() => {
    if (activeFilter.type === 'role') {
      return groups.find((g) => g.id === activeFilter.id)?.nom ?? 'Utilisateurs'
    }
    return 'Utilisateurs'
  }, [activeFilter, groups])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, rowsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredList.length / rowsPerPage))
  const pageSafe = Math.min(page, totalPages)
  const pageItems = filteredList.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage)

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    setSelected(
      selected.length === pageItems.length && pageItems.length > 0
        ? []
        : pageItems.map((u) => u.id)
    )
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" ?`)) return
    await deleteUser(id)
    fetchUsers()
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Supprimer les ${selected.length} utilisateurs sélectionnés ?`)) return
    await Promise.all(selected.map((id) => deleteUser(id)))
    setSelected([])
    fetchUsers()
  }

  const handleToggleStatut = async (id) => {
    await toggleUserStatut(id)
    fetchUsers()
  }

  const openAdd = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditingItem(user)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleSaved = () => {
    closeForm()
    fetchUsers()
  }

  return (
    <div className="dp-page">
      <div className="dp-layout">
        {/* ── Panneau gauche : groupé par rôle ── */}
        <div className="dp-tree-panel">
          <div className="dp-tree-header">
            <FontAwesomeIcon icon={faUserShield} />
            Utilisateurs
          </div>

          <div className="dp-tree-list">
            <button
              className={`dp-tree-item dp-tree-item-all ${activeFilter.type === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter({ type: 'all' })}
            >
              <FontAwesomeIcon
                icon={activeFilter.type === 'all' ? faFolderOpen : faFolder}
                className="dp-tree-icon"
              />
              <span className="dp-tree-label">Tous les utilisateurs</span>
              <span className="dp-tree-count">{allUsers.length}</span>
            </button>

            {groups.map((group) => {
              const isActiveGroup = activeFilter.type === 'role' && activeFilter.id === group.id
              return (
                <button
                  key={group.id}
                  className={`dp-tree-item ${isActiveGroup ? 'active' : ''}`}
                  onClick={() => setActiveFilter({ type: 'role', id: group.id })}
                >
                  <FontAwesomeIcon
                    icon={isActiveGroup ? faFolderOpen : faFolder}
                    className="dp-tree-icon"
                  />
                  <span className="dp-tree-label">{group.nom}</span>
                  <span className="dp-tree-count">{group.users.length}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Panneau principal ── */}
        <div className="dp-card">
          <div className="dp-card-header">
            <div>
              <div className="dp-card-title">
                <span className="dp-dot" />
                {currentTitle}
              </div>
              <div className="dp-card-subtitle">
                {filteredList.length} utilisateur{filteredList.length !== 1 ? 's' : ''} actuellement affiché
                {filteredList.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="dp-header-actions">
              <button className="dp-add-btn" onClick={openAdd}>
                <FontAwesomeIcon icon={faPlus} />
                Ajouter Utilisateur
              </button>
            </div>
          </div>

          <div className="dp-table-wrapper">
            <table className="dp-table">
              <thead>
                <tr>
                  <th className="dp-th-checkbox">
                    <input
                      type="checkbox"
                      checked={selected.length === pageItems.length && pageItems.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>NOM</th>
                  <th>EMAIL</th>
                  <th>RÔLE</th>
                  <th>DÉPARTEMENT</th>
                  <th>STATUT</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="dp-empty-cell">Chargement...</td>
                  </tr>
                )}

                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="dp-empty-cell">Aucun utilisateur trouvé.</td>
                  </tr>
                )}

                {!loading &&
                  pageItems.map((user) => (
                    <tr key={user.id} className={selected.includes(user.id) ? 'dp-row-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="dp-cell-nom">{user.name}</td>
                      <td className="text-muted">{user.email}</td>
                      <td>
                        {user.role ? (
                          <span className={`us-badge ${ROLE_COLORS[user.role.name] || ''}`}>
                            {user.role.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{user.departement?.nom || '-'}</td>
                      <td>
                        <span
                          className={
                            user.statut === 'actif' ? 'badge-status-actif' : 'badge-status-inactif'
                          }
                        >
                          {user.statut}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="dp-action-btn dp-action-edit"
                          onClick={() => openEdit(user)}
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          className="dp-action-btn us-action-toggle"
                          onClick={() => handleToggleStatut(user.id)}
                          title={user.statut === 'actif' ? 'Désactiver' : 'Activer'}
                        >
                          <FontAwesomeIcon icon={faPowerOff} />
                        </button>
                        <button
                          className="dp-action-btn dp-action-danger"
                          onClick={() => handleDelete(user.id, user.name)}
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="dp-card-footer">
            <button
              className="dp-delete-selection"
              disabled={selected.length === 0}
              onClick={handleDeleteSelected}
            >
              <FontAwesomeIcon icon={faTrash} />
              SUPPRIMER SELECTION
            </button>

            <div className="dp-pagination-controls">
              <select
                className="dp-rows-select"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="dp-pg-label">lignes par page</span>

              <button
                className="dp-page-arrow"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <span className="dp-page-number active">{pageSafe}</span>
              <button
                className="dp-page-arrow"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <UserForm
            key={editingItem?.id ?? 'new'}
            initialData={editingItem}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Users