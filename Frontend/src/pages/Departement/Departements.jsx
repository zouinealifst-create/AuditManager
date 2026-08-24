import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFilter, faPen, faTrash, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { getDepartements, deleteDepartement } from '../../services/departementService'
// import DepartementForm from '../../components/DepartementForm'
import './Departements.css'

const FILTERS = [
  { id: 'tous', label: 'Tous les départements' },
  { id: 'avec_resp', label: 'Avec responsable' },
  { id: 'sans_resp', label: 'Sans responsable' },
]

function Departements() {
  const [departements, setDepartements] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeFilter, setActiveFilter] = useState('tous')

  const fetchDepartements = async (p = 1) => {
    setLoading(true)
    try {
      const data = await getDepartements(p)
      setDepartements(data.data)
      setMeta(data.meta)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartements(page)
  }, [page])

  const filteredList = useMemo(() => {
    if (activeFilter === 'avec_resp') return departements.filter((d) => d.responsable)
    if (activeFilter === 'sans_resp') return departements.filter((d) => !d.responsable)
    return departements
  }, [departements, activeFilter])

  const counts = useMemo(() => ({
    tous: departements.length,
    avec_resp: departements.filter((d) => d.responsable).length,
    sans_resp: departements.filter((d) => !d.responsable).length,
  }), [departements])

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    setSelected(selected.length === filteredList.length ? [] : filteredList.map((d) => d.id))
  }

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer le département "${nom}" ?`)) return
    await deleteDepartement(id)
    fetchDepartements(page)
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Supprimer les ${selected.length} départements sélectionnés ?`)) return
    await Promise.all(selected.map((id) => deleteDepartement(id)))
    setSelected([])
    fetchDepartements(page)
  }

  const openAdd = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const openEdit = (dept) => {
    setEditingItem(dept)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleSaved = () => {
    closeForm()
    fetchDepartements(page)
  }

  return (
    <div className="dept-page">
      <div className="dept-layout">
        {/* ── Panneau gauche ── */}
        <div className="dept-side-panel">
          <div className="dept-side-header">
            <FontAwesomeIcon icon={faSitemap} />
            Filtres
          </div>

          <div className="dept-side-list">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`dept-side-item ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                <span>{f.label}</span>
                <span className="dept-side-count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Panneau principal ── */}
        <div className="dept-card">
          <div className="dept-card-header">
            <div>
              <div className="dept-card-title">
                <span className="dept-dot" />
                Départements
              </div>
              <div className="dept-card-subtitle">
                {filteredList.length} département(s) actuellement affiché(s)
              </div>
            </div>

            <div className="dept-header-actions">
              <button className="dept-filter-icon" title="Filtres">
                <FontAwesomeIcon icon={faFilter} />
              </button>
              <button className="dept-add-btn" onClick={openAdd}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Ajouter Département
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dept-table">
              <thead>
                <tr>
                  <th className="dept-th-checkbox">
                    <input
                      type="checkbox"
                      checked={selected.length === filteredList.length && filteredList.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>NOM</th>
                  <th>DESCRIPTION</th>
                  <th>RESPONSABLE</th>
                  <th>EMPLOYÉS</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loading && filteredList.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Aucun département trouvé.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredList.map((dept) => (
                    <tr key={dept.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(dept.id)}
                          onChange={() => toggleSelect(dept.id)}
                        />
                      </td>
                      <td className="fw-medium">{dept.nom}</td>
                      <td>
                        {dept.description || (
                          <span className="text-muted-italic">Aucune description</span>
                        )}
                      </td>
                      <td>{dept.responsable?.name || '-'}</td>
                      <td>{dept.nombre_employes ?? 0}</td>
                      <td className="text-end">
                        <button className="dept-action-btn edit" onClick={() => openEdit(dept)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          className="dept-action-btn danger"
                          onClick={() => handleDelete(dept.id, dept.nom)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="dept-card-footer">
            <button
              className="dept-delete-selection"
              disabled={selected.length === 0}
              onClick={handleDeleteSelected}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              SUPPRIMER SELECTION
            </button>

            <div className="dept-pagination-controls">
              <select
                className="dept-rows-select"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-muted">lignes par page</span>

              <button
                className="dept-page-arrow"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>
              <span className="dept-page-number active">{page}</span>
              <button
                className="dept-page-arrow"
                disabled={!meta || page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <DepartementForm initialData={editingItem} onClose={closeForm} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default Departements