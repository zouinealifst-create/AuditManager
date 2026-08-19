/**
 * AuditsListPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Écran principal du module Audit.
 *
 * Layout :
 *   [Panneau Départements] | [Header + Filtres + Tableau des audits]
 *
 * Fonctionnalités :
 *   • Navigation par département (filtre automatique)
 *   • Filtre local : recherche texte + statut
 *   • Tableau : titre, checklist, norme, département, auditeur, date, statut, actions
 *   • Actions : Voir détails / Planifier (si brouillon) / Supprimer
 *   • Bouton "+ Nouvel Audit" → prop onNew()
 */
import { useState, useEffect, useMemo } from 'react'
import { Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardCheck, faPlus, faSearch, faEye, faCalendarCheck,
  faTrash, faFolder, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { getAudits, deleteAudit } from '../../api/audits'
import { getDepartements } from '../../api/departements'
import './AuditsListPage.css'

// ── Helpers ──────────────────────────────────────────────────

const STATUT_CONFIG = {
  brouillon:  { label: 'Brouillon',  cls: 'au-badge-brouillon',  dot: '⚪' },
  planifie:   { label: 'Planifié',   cls: 'au-badge-planifie',   dot: '🔵' },
  en_cours:   { label: 'En cours',   cls: 'au-badge-en_cours',   dot: '🟡' },
  termine:    { label: 'Terminé',    cls: 'au-badge-termine',    dot: '🟢' },
  cloture:    { label: 'Clôturé',    cls: 'au-badge-cloture',    dot: '🟣' },
}

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, cls: 'au-badge-brouillon', dot: '⚪' }
  return <span className={`au-badge ${cfg.cls}`}>{cfg.dot} {cfg.label}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Composant principal ──────────────────────────────────────
export default function AuditsListPage({ onNew, onView }) {
  const [audits,      setAudits]      = useState([])
  const [departements,setDepartements]= useState([])
  const [selectedDept,setSelectedDept]= useState(null) // null = tous
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [filterStatut,setFilterStatut]= useState('')
  const [page,        setPage]        = useState(1)
  const [lastPage,    setLastPage]    = useState(1)
  const [total,       setTotal]       = useState(0)

  // ── Charger départements une seule fois ──
  useEffect(() => {
    getDepartements()
      .then(data => setDepartements(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // ── Charger audits à chaque changement de filtre/page ──
  useEffect(() => {
    setLoading(true)
    setError('')
    const params = { page }
    if (selectedDept)  params.departement_id = selectedDept
    if (filterStatut)  params.statut         = filterStatut

    getAudits(params)
      .then(res => {
        setAudits(res.data ?? [])
        setLastPage(res.last_page ?? 1)
        setTotal(res.total ?? 0)
      })
      .catch(() => setError('Impossible de charger les audits.'))
      .finally(() => setLoading(false))
  }, [selectedDept, filterStatut, page])

  // Remet la page à 1 quand les filtres changent
  const handleDeptChange = (id) => {
    setSelectedDept(id)
    setPage(1)
  }
  const handleStatutChange = (v) => {
    setFilterStatut(v)
    setPage(1)
  }

  // ── Filtre texte local ──
  const filtered = useMemo(() => {
    if (!search.trim()) return audits
    const q = search.toLowerCase()
    return audits.filter(a =>
      a.titre?.toLowerCase().includes(q) ||
      a.checklist?.titre?.toLowerCase().includes(q) ||
      a.auditeur?.name?.toLowerCase().includes(q) ||
      a.departement?.nom?.toLowerCase().includes(q)
    )
  }, [audits, search])

  // ── Suppression ──
  const handleDelete = async (audit) => {
    const result = await Swal.fire({
      title: 'Supprimer l\'audit ?',
      html: `<b>${audit.titre}</b><br><small>Cette action est irréversible.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteAudit(audit.id)
      setAudits(prev => prev.filter(a => a.id !== audit.id))
      Swal.fire({ icon: 'success', title: 'Supprimé !', text: 'Audit supprimé avec succès.', timer: 1800, showConfirmButton: false })
    } catch {
      Swal.fire('Erreur', 'Impossible de supprimer l\'audit.', 'error')
    }
  }

  const deptLabel = selectedDept
    ? departements.find(d => d.id === selectedDept)?.nom ?? `Département #${selectedDept}`
    : 'Tous les départements'

  return (
    <div className="au-page">
      {/* ── Panneau Départements ── */}
      <div className="au-dept-panel">
        <div className="au-dept-header">Départements</div>
        <div className="au-dept-list">
          <div
            className={`au-dept-item au-dept-all ${selectedDept === null ? 'active' : ''}`}
            onClick={() => handleDeptChange(null)}
          >
            <span className="au-dept-icon">🗂</span>
            Tous
          </div>
          {departements.map(d => (
            <div
              key={d.id}
              className={`au-dept-item ${selectedDept === d.id ? 'active' : ''}`}
              onClick={() => handleDeptChange(d.id)}
            >
              <FontAwesomeIcon icon={faFolder} className="au-dept-icon" />
              {d.nom}
            </div>
          ))}
        </div>
      </div>

      {/* ── Zone principale ── */}
      <div className="au-main">
        {/* Header */}
        <div className="au-page-header">
          <div className="au-page-title-wrap">
            <div className="au-page-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div>
              <h1 className="au-page-title">Audits</h1>
              <p className="au-page-sub">{deptLabel} · {total} audit{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button className="au-btn-new" onClick={onNew}>
            <FontAwesomeIcon icon={faPlus} />
            Nouvel Audit
          </button>
        </div>

        {/* Filtres */}
        <div className="au-filters">
          <div className="au-search-wrap">
            <FontAwesomeIcon icon={faSearch} className="au-search-icon" />
            <input
              className="au-input"
              placeholder="Rechercher un audit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="au-select"
            value={filterStatut}
            onChange={e => handleStatutChange(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* Corps */}
        <div className="au-body">
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="au-loading">
              <Spinner animation="border" style={{ color: 'var(--color-primary, #3a8a90)' }} />
              <span>Chargement…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="au-empty">
              <FontAwesomeIcon icon={faClipboardCheck} className="au-empty-icon" />
              <span>Aucun audit trouvé.</span>
              <button className="au-btn-new" style={{ marginTop: '0.5rem' }} onClick={onNew}>
                <FontAwesomeIcon icon={faPlus} />
                Créer le premier audit
              </button>
            </div>
          ) : (
            <>
              <div className="au-table-wrap">
                <table className="au-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Checklist / Norme</th>
                      <th>Département</th>
                      <th>Auditeur</th>
                      <th>Date prévue</th>
                      <th>Statut</th>
                      <th>Progression</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map(audit => (
                        <motion.tr
                          key={audit.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <td>
                            <div className="au-audit-title">{audit.titre}</div>
                            <div className="au-audit-sub">#{audit.id}</div>
                          </td>
                          <td>
                            <div>{audit.checklist?.titre ?? '—'}</div>
                            {audit.checklist?.norme && (
                              <div className="au-norme-code">{audit.checklist.norme.code}</div>
                            )}
                          </td>
                          <td>{audit.departement?.nom ?? '—'}</td>
                          <td>{audit.auditeur?.name ?? '—'}</td>
                          <td>{formatDate(audit.date_prevue)}</td>
                          <td><StatutBadge statut={audit.statut} /></td>
                          <td>
                            {/* Progression — non disponible tant que reponses n'est pas développé */}
                            <div className="au-progress-wrap">
                              <div className="au-progress-bar">
                                <div className="au-progress-fill" style={{ width: '0%' }} />
                              </div>
                              <span className="au-progress-label">— / —</span>
                            </div>
                          </td>
                          <td>
                            <div className="au-actions">
                              <button
                                className="au-action-btn au-action-view"
                                title="Voir détails"
                                onClick={() => onView?.(audit)}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {audit.statut === 'brouillon' && (
                                <button
                                  className="au-action-btn au-action-plan"
                                  title="Planifier"
                                  onClick={() => onView?.(audit, 'planifier')}
                                >
                                  <FontAwesomeIcon icon={faCalendarCheck} />
                                </button>
                              )}
                              <button
                                className="au-action-btn au-action-delete"
                                title="Supprimer"
                                onClick={() => handleDelete(audit)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="au-pagination">
                  <span>{total} audit{total !== 1 ? 's' : ''} au total</span>
                  <div className="au-pg-controls">
                    <button className="au-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    {Array.from({ length: lastPage }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
                      .map(p => (
                        <button
                          key={p}
                          className={`au-pg-btn ${p === page ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >{p}</button>
                      ))
                    }
                    <button className="au-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === lastPage}>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
