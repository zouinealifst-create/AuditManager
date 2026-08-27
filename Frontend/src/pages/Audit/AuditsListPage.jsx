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
 *
 * Migration RTK Query :
 *   • useGetDepartementsQuery  → liste des départements (cache 10 min)
 *   • useGetAuditsQuery        → audits paginés/filtrés (cache 2 min)
 *   • useDeleteAuditMutation   → suppression avec invalidation automatique de la liste
 */
import { useState, useMemo, useEffect } from 'react'
import { Spinner, Alert, Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardCheck, faPlus, faSearch, faEye, faCalendarCheck,
  faTrash, faFolder, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { useGetAuditsQuery, useDeleteAuditMutation } from '../../store/api/auditsApi'
import { useGetDepartementsQuery } from '../../store/api/departementsApi'
import AuditCreate from './AuditCreate'
import AuditDetail from './AuditDetail'
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
export default function AuditsListPage() {
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [modalMode,     setModalMode]     = useState(null) // null | 'detail'
  const [selectedAudit, setSelectedAudit] = useState(null)

  const [selectedDept,  setSelectedDept]  = useState(null) // null = tous
  const [search,        setSearch]        = useState('')
  const [filterStatut,  setFilterStatut]  = useState('')
  const [page,          setPage]          = useState(1)

  // ── Données RTK Query ────────────────────────────────────────
  // getDepartements : cache 10 min, aucun re-fetch inutile entre navigations
  const {
    data: departements = [],
    isLoading: loadingDepts,
  } = useGetDepartementsQuery()

  // getAudits : cache 2 min, invalidé automatiquement après deleteAudit
  const {
    data: auditsPage,
    isLoading: loadingAudits,
    isError: errorAudits,
    isFetching,
  } = useGetAuditsQuery({
    page,
    departement_id: selectedDept ?? undefined,
    statut:         filterStatut || undefined,
  })

  const audits   = auditsPage?.data     ?? []
  const lastPage = auditsPage?.last_page ?? 1
  const total    = auditsPage?.total     ?? 0

  // ── Mutation suppression ─────────────────────────────────────
  const [deleteAudit] = useDeleteAuditMutation()

  // Remet page à 1 quand filtre change
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
      a.checklists?.some(c => c.titre?.toLowerCase().includes(q)) ||
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
      await deleteAudit(audit.id).unwrap()
      // La liste est automatiquement rafraîchie via invalidatesTags: ['Audit', 'LIST']
      Swal.fire({ icon: 'success', title: 'Supprimé !', text: 'Audit supprimé avec succès.', timer: 1800, showConfirmButton: false })
    } catch {
      Swal.fire('Erreur', 'Impossible de supprimer l\'audit.', 'error')
    }
  }

  const loading  = loadingAudits || loadingDepts
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
            className={`au-dept-item ${selectedDept === null ? 'active' : ''}`}
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
              <p className="au-page-sub">
                {deptLabel} · {total} audit{total !== 1 ? 's' : ''}
                {isFetching && !loading && (
                  <Spinner size="sm" animation="border" className="ms-2" style={{ width: '0.8rem', height: '0.8rem', color: 'var(--color-primary)' }} />
                )}
              </p>
            </div>
          </div>
          <button className="au-btn-new" onClick={() => setPanelOpen(true)}>
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
          {errorAudits && <Alert variant="danger">Impossible de charger les audits.</Alert>}

          {loading ? (
            <div className="au-loading">
              <Spinner animation="border" style={{ color: 'var(--color-primary, #3a8a90)' }} />
              <span>Chargement…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="au-empty">
              <FontAwesomeIcon icon={faClipboardCheck} className="au-empty-icon" />
              <span>Aucun audit trouvé.</span>
              <button className="au-btn-new" style={{ marginTop: '0.5rem' }} onClick={() => setPanelOpen(true)}>
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
                      <th>Checklists / Normes</th>
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
                            <div>{audit.checklists?.map(c => c.titre).join(' / ') || '—'}</div>
                            {audit.checklists && audit.checklists.length > 0 && (
                              <div className="au-norme-code">
                                {Array.from(new Set(audit.checklists.map(c => c.norme?.code).filter(Boolean))).join(', ')}
                              </div>
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
                                onClick={() => { setSelectedAudit(audit); setModalMode('detail'); }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {audit.statut === 'brouillon' && (
                                <button
                                  className="au-action-btn au-action-plan"
                                  title="Planifier"
                                  onClick={() => { setSelectedAudit(audit); setModalMode('detail'); }}
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

      {/* ── Modale de Création (Audit) ── */}
      <Modal
        show={panelOpen}
        onHide={() => setPanelOpen(false)}
        size="xl"
        centered
        scrollable
        dialogClassName="au-modal-dialog"
      >
        <Modal.Body className="p-0" style={{ background: '#f8fafc' }}>
          <AuditCreate
            onCancel={() => setPanelOpen(false)}
            onCreated={() => setPanelOpen(false)}
          />
        </Modal.Body>
      </Modal>

      {/* ── Modale de Détail ── */}
      <Modal
        show={modalMode === 'detail'}
        onHide={() => { setModalMode(null); setSelectedAudit(null); }}
        size="xl"
        centered
        scrollable
        dialogClassName="au-modal-dialog"
      >
        <Modal.Body className="p-0" style={{ background: '#f8fafc' }}>
          {modalMode === 'detail' && selectedAudit && (
            <AuditDetail
              auditId={selectedAudit.id}
              onBack={() => { setModalMode(null); setSelectedAudit(null); }}
            />
          )}
        </Modal.Body>
      </Modal>

    </div>
  )
}
