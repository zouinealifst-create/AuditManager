import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus, faMinus, faFilter, faPen, faTrash, faFolder, faFolderOpen,
    faChevronLeft, faChevronRight, faCircleUser, faSitemap,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { AnimatePresence } from 'framer-motion'
import { getDepartements, deleteDepartement } from '../../services/departementService'

import DepartementForm from '../../components/DepartementForm'
import './Departements.css'

function Departements() {
    const [allDepartements, setAllDepartements] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [activeFilter, setActiveFilter] = useState({ type: 'all' })
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    // Ids des groupes (secteurs) repliés. Un groupe absent de ce Set = déplié.
    const [collapsedGroups, setCollapsedGroups] = useState(new Set())

    const fetchDepartements = async () => {
        setLoading(true)
        try {
        const data = await getDepartements({ per_page: 100 })
        setAllDepartements(data.data)
        } finally {
        setLoading(false)
        }
    }

  useEffect(() => {
    fetchDepartements()
  }, [])

  // ── Groupement par secteur (avec "Sans secteur" toujours en dernier) ──
  const groups = useMemo(() => {
    const map = new Map()
    allDepartements.forEach((d) => {
      const key = d.secteur ? d.secteur.id : 'none'
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          nom: d.secteur ? d.secteur.nom : 'Sans secteur',
          departements: [],
        })
      }
      map.get(key).departements.push(d)
    })
    const list = Array.from(map.values())
    list.sort((a, b) => {
      if (a.id === 'none') return 1
      if (b.id === 'none') return -1
      return a.nom.localeCompare(b.nom)
    })
    return list
  }, [allDepartements])

  // ── Liste filtrée selon la sélection du panneau gauche ──
  const filteredList = useMemo(() => {
    if (activeFilter.type === 'secteur') {
      return allDepartements.filter((d) => (d.secteur ? d.secteur.id : 'none') === activeFilter.id)
    }
    if (activeFilter.type === 'dept') {
      return allDepartements.filter((d) => d.id === activeFilter.id)
    }
    return allDepartements
  }, [allDepartements, activeFilter])

  const currentTitle = useMemo(() => {
    if (activeFilter.type === 'secteur') {
      return groups.find((g) => g.id === activeFilter.id)?.nom ?? 'Départements'
    }
    if (activeFilter.type === 'dept') {
      return allDepartements.find((d) => d.id === activeFilter.id)?.nom ?? 'Départements'
    }
    return 'Départements'
  }, [activeFilter, groups, allDepartements])

  // ── Pagination côté client ──
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
        : pageItems.map((d) => d.id)
    )
  }

  // ── Plier / déplier un groupe (secteur) — n'affecte pas le filtre actif ──
  const toggleGroupCollapse = (groupId, e) => {
    e.stopPropagation()
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer le département "${nom}" ?`)) return
    await deleteDepartement(id)
    if (activeFilter.type === 'dept' && activeFilter.id === id) {
      setActiveFilter({ type: 'all' })
    }
    fetchDepartements()
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Supprimer les ${selected.length} départements sélectionnés ?`)) return
    await Promise.all(selected.map((id) => deleteDepartement(id)))
    setSelected([])
    fetchDepartements()
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
    fetchDepartements()
  }

  return (
    <div className="dp-page">
      <div className="dp-layout">
        {/* ── Panneau gauche : arborescence pliable par secteur ── */}
        <div className="dp-tree-panel">
          <div className="dp-tree-header">
            <FontAwesomeIcon icon={faSitemap} />
            Départements
          </div>

          <div className="dp-tree-list">
            <button
              className={`dp-tree-item dp-tree-item-all ${
                activeFilter.type === 'all' ? 'active' : ''
              }`}
              onClick={() => setActiveFilter({ type: 'all' })}
            >
              <FontAwesomeIcon
                icon={activeFilter.type === 'all' ? faFolderOpen : faFolder}
                className="dp-tree-icon"
              />
              <span className="dp-tree-label">Tous les départements</span>
              <span className="dp-tree-count">{allDepartements.length}</span>
            </button>

            {groups.map((group) => {
              const isWarning = group.id === 'none'
              const isActiveGroup =
                activeFilter.type === 'secteur' && activeFilter.id === group.id
              const isCollapsed = collapsedGroups.has(group.id)

              return (
                <div key={group.id} className="dp-tree-group">
                  <button
                    className={`dp-tree-item dp-tree-group-header ${
                      isActiveGroup ? 'active' : ''
                    } ${isWarning ? 'warning' : ''}`}
                    onClick={() => setActiveFilter({ type: 'secteur', id: group.id })}
                  >
                    {/* Icône +/- : plier / déplier sans changer le filtre */}
                    <span
                      className="dp-tree-toggle"
                      onClick={(e) => toggleGroupCollapse(group.id, e)}
                      role="button"
                      tabIndex={0}
                      aria-label={isCollapsed ? 'Déplier' : 'Plier'}
                    >
                      <FontAwesomeIcon icon={isCollapsed ? faPlus : faMinus} />
                    </span>

                    <FontAwesomeIcon
                      icon={isWarning ? faTriangleExclamation : (isActiveGroup ? faFolderOpen : faFolder)}
                      className="dp-tree-icon"
                    />
                    <span className="dp-tree-label">{group.nom}</span>
                    <span className="dp-tree-count">{group.departements.length}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="dp-tree-sub-list">
                      {group.departements.map((d) => {
                        const isActiveDept = activeFilter.type === 'dept' && activeFilter.id === d.id
                        return (
                          <button
                            key={d.id}
                            className={`dp-tree-sub-item ${isActiveDept ? 'active' : ''}`}
                            onClick={() => setActiveFilter({ type: 'dept', id: d.id })}
                            title={d.nom}
                          >
                            <FontAwesomeIcon
                              icon={isActiveDept ? faFolderOpen : faFolder}
                              className="dp-tree-sub-icon"
                            />
                            <span className="dp-tree-sub-label">{d.nom}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {!loading && allDepartements.length === 0 && (
              <div className="dp-tree-empty">Aucun département.</div>
            )}
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
                {filteredList.length} département{filteredList.length !== 1 ? 's' : ''} actuellement affiché
                {filteredList.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="dp-header-actions">
              <button className="dp-filter-icon" title="Filtres">
                <FontAwesomeIcon icon={faFilter} />
              </button>
              <button className="dp-add-btn" onClick={openAdd}>
                <FontAwesomeIcon icon={faPlus} />
                Ajouter Département
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
                  <th>SECTEUR</th>
                  <th>DESCRIPTION</th>
                  <th>RESPONSABLE</th>
                  <th>EMPLOYÉS</th>
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
                    <td colSpan="7" className="dp-empty-cell">Aucun département trouvé.</td>
                  </tr>
                )}

                {!loading &&
                  pageItems.map((dept) => (
                    <tr key={dept.id} className={selected.includes(dept.id) ? 'dp-row-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(dept.id)}
                          onChange={() => toggleSelect(dept.id)}
                        />
                      </td>
                      <td className="dp-cell-nom">{dept.nom}</td>
                      <td>
                        {dept.secteur ? (
                          dept.secteur.nom
                        ) : (
                          <span className="dp-badge-warning">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="me-1" />
                            Sans secteur
                          </span>
                        )}
                      </td>
                      <td>
                        {dept.description || (
                          <span className="dp-text-muted-italic">Aucune description</span>
                        )}
                      </td>
                      <td>
                        {dept.responsable ? (
                          <span className="dp-resp-chip">
                            <FontAwesomeIcon icon={faCircleUser} />
                            {dept.responsable.name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{dept.nombre_employes ?? 0}</td>
                      <td className="text-end">
                        <button
                          className="dp-action-btn dp-action-edit"
                          onClick={() => openEdit(dept)}
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          className="dp-action-btn dp-action-danger"
                          onClick={() => handleDelete(dept.id, dept.nom)}
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
          <DepartementForm
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

export default Departements