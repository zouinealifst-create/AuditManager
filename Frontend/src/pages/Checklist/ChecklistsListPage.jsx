/**
 * ChecklistsListPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Écran "Liste des Checklists" — inspiré de l'écran Avertissements.
 *
 * Fonctionnalités :
 *   • Chargement paginé depuis GET /api/checklists (15/page côté back)
 *   • Filtres locaux : recherche texte (titre), statut, norme
 *   • Tableau striped + hover avec colonnes : checkbox, titre, norme,
 *     statut (badge), questions, créé par, date, actions (éditer/supprimer)
 *   • Sélection multiple + suppression en masse (confirmation Swal)
 *   • Panneau latéral d'édition (ChecklistEditPanel) avec AnimatePresence
 *   • Bouton "+ Nouvelle Checklist" → bascule vers ChecklistCreate (prop onNew)
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Table, Form, Button, Spinner, Alert, Badge,
} from 'react-bootstrap'
import { AnimatePresence, motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, faTrash, faFilter, faSearch, faPlus,
  faChevronLeft, faChevronRight, faLayerGroup, faEye,
} from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import { listChecklists, deleteChecklist, getChecklist } from '../../api/checklists'
import { getAllNormes } from '../../api/normes'
import ChecklistEditPanel from '../../components/ChecklistEditPanel'
import './ChecklistsListPage.css'

// ── Helpers ──────────────────────────────────────────────────

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'cl-badge-brouillon' },
  actif: { label: 'Actif', cls: 'cl-badge-actif' },
  archive: { label: 'Archivé', cls: 'cl-badge-archive' },
}

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, cls: 'cl-badge-brouillon' }
  return <span className={`cl-badge ${cfg.cls}`}>{cfg.label}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// ── Composant principal ──────────────────────────────────────
export default function ChecklistsListPage({ onNew }) {
  // ── Données brutes ──────────────────────────────────────
  const [checklists, setChecklists] = useState([])
  const [normes, setNormes] = useState([])

  // ── Filtres ─────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterNorme, setFilterNorme] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // ── Pagination ──────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [apiTotal, setApiTotal] = useState(0)
  const [apiLastPg, setApiLastPg] = useState(1)

  // ── Loading / erreurs ────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  // ── Sélection ────────────────────────────────────────────
  const [selected, setSelected] = useState(new Set())

  // ── Édition ──────────────────────────────────────────────
  const [editChecklist, setEditChecklist] = useState(null)

  // ── Chargement des normes (une seule fois) ────────────────
  useEffect(() => {
    getAllNormes()
      .then(data => setNormes(Array.isArray(data) ? data : []))
      .catch(() => { }) // non bloquant
  }, [])

  // ── Chargement des checklists (rechargé si page change) ───
  const loadChecklists = useCallback(async (pg = 1) => {
    setLoading(true)
    setErreur('')
    try {
      const params = { page: pg }
      if (filterStatut) params.statut = filterStatut
      if (filterNorme) params.norme_id = filterNorme
      const result = await listChecklists(params)
      setChecklists(result.data ?? [])
      setApiTotal(result.total ?? 0)
      setApiLastPg(result.last_page ?? 1)
      setSelected(new Set())
    } catch {
      setErreur('Impossible de charger les checklists.')
    } finally {
      setLoading(false)
    }
  }, [filterStatut, filterNorme])

  useEffect(() => { loadChecklists(page) }, [page]) // eslint-disable-line

  // Réinitialiser à la page 1 quand les filtres API changent
  useEffect(() => {
    setPage(1)
    loadChecklists(1)
  }, [filterStatut, filterNorme]) // eslint-disable-line

  // ── Filtrage local (recherche texte) ──────────────────────
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return checklists
    return checklists.filter(c =>
      c.titre?.toLowerCase().includes(q) ||
      c.norme?.code?.toLowerCase().includes(q) ||
      c.norme?.nom?.toLowerCase().includes(q)
    )
  }, [checklists, search])

  // Pagination locale (découpe displayed selon pageSize)
  const localTotalPages = Math.max(1, Math.ceil(displayed.length / pageSize))
  const localPage = Math.min(page, localTotalPages)
  const pageItems = search.trim()
    ? displayed.slice((localPage - 1) * pageSize, localPage * pageSize)
    : displayed // déjà paginé côté back — afficher tel quel

  // ── Sélection ────────────────────────────────────────────
  const allChecked = pageItems.length > 0 && pageItems.every(c => selected.has(c.id))
  const toggleAll = () => {
    if (allChecked) {
      setSelected(prev => { const s = new Set(prev); pageItems.forEach(c => s.delete(c.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); pageItems.forEach(c => s.add(c.id)); return s })
    }
  }
  const toggleOne = id => setSelected(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  // ── Suppression simple ────────────────────────────────────
  const handleDelete = async (cl) => {
    const result = await Swal.fire({
      title: 'Supprimer la checklist ?',
      html: `<b>${cl.titre}</b> sera définitivement supprimée.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteChecklist(cl.id)
      setChecklists(prev => prev.filter(c => c.id !== cl.id))
      setSelected(prev => { const s = new Set(prev); s.delete(cl.id); return s })
    } catch (error) {
      const msg = error.response?.data?.message || 'Impossible de supprimer cette checklist.'
      Swal.fire('Erreur', msg, 'error')
    }
  }

  // ── Suppression en masse ──────────────────────────────────
  const handleDeleteSelected = async () => {
    const ids = [...selected]
    const result = await Swal.fire({
      title: `Supprimer ${ids.length} checklist${ids.length > 1 ? 's' : ''} ?`,
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    const failed = []
    let lastErrorMsg = ''
    for (const id of ids) {
      try { await deleteChecklist(id) }
      catch (error) {
        failed.push(id)
        if (error.response?.data?.message) {
          lastErrorMsg = error.response.data.message
        }
      }
    }
    if (failed.length > 0) {
      const msg = lastErrorMsg ? `Dernière erreur : ${lastErrorMsg}` : `${failed.length} suppression(s) ont échoué.`
      Swal.fire('Attention', msg, 'warning')
    }
    setChecklists(prev => prev.filter(c => !ids.includes(c.id) || failed.includes(c.id)))
    setSelected(new Set(failed))
  }

  // ── Affichage des questions (Popup) ───────────────────────
  const handleViewQuestions = async (cl) => {
    let questions = cl.questions
    // Si les questions ne sont pas dans le state local
    if (!questions) {
      try {
        const detail = await getChecklist(cl.id)
        questions = detail.questions
      } catch {
        Swal.fire('Erreur', 'Impossible de charger les questions.', 'error')
        return
      }
    }

    if (!questions || questions.length === 0) {
      Swal.fire('Questions', 'Aucune question pour cette checklist.', 'info')
      return
    }

    const getStatutCls = (st) => {
      if (st === 'actif') return 'cl-badge-actif'
      if (st === 'archive') return 'cl-badge-archive'
      return 'cl-badge-brouillon'
    }
    const statutLabel = cl.statut === 'actif' ? 'Actif' : cl.statut === 'archive' ? 'Archivé' : 'Brouillon'

    const htmlList = `
      <div class="cl-modal-header">
        <div class="cl-modal-row">
          <span class="cl-modal-label">TITRE</span>
          <span class="cl-modal-val-title">${cl.titre}</span>
        </div>
        <div class="cl-modal-row">
          <span class="cl-modal-label">NORME</span>
          <span class="cl-modal-val">${cl.norme ? `${cl.norme.code} — ${cl.norme.nom}` : '—'}</span>
        </div>
        <div class="cl-modal-row">
          <span class="cl-modal-label">STATUT</span>
          <span class="cl-modal-val">
            <span class="cl-badge ${getStatutCls(cl.statut)}">${statutLabel}</span>
          </span>
        </div>
      </div>
      <div class="cl-modal-sep"></div>
      <div class="cl-modal-q-header">QUESTIONS (${questions.length})</div>
      <div class="cl-modal-q-list">
        <ol>
          ${questions.map(q => `<li>${q.texte}</li>`).join('')}
        </ol>
      </div>
    `

    Swal.fire({
      title: 'Détails de la checklist',
      html: htmlList,
      confirmButtonText: 'Fermer',
      width: '600px',
      customClass: {
        popup: 'cl-swal-popup'
      }
    })
  }

  // ── Après édition ─────────────────────────────────────────
  const handleSaved = (updated) => {
    setChecklists(prev => prev.map(c =>
      c.id === updated?.id
        ? { ...c, ...updated, norme: updated.norme ?? c.norme }
        : c
    ))
    setEditChecklist(null)
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="cl-page">

      {/* ── En-tête ── */}
      <div className="cl-header">
        <div className="cl-header-left">
          <div className="cl-page-icon">
            <FontAwesomeIcon icon={faLayerGroup} />
          </div>
          <div>
            <h1 className="cl-page-title">Liste des Checklists</h1>
            <p className="cl-page-sub">
              {apiTotal} checklist{apiTotal !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        <div className="cl-header-right">
          <button
            className="cl-btn-filter"
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
          >
            <FontAwesomeIcon icon={faFilter} />
            Filtres
            {(filterStatut || filterNorme) && <span className="cl-filter-dot" />}
          </button>
          <button className="cl-btn-new" onClick={onNew}>
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Nouvelle Checklist
          </button>
        </div>
      </div>

      {/* ── Barre de filtres animée ── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="cl-filters-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="cl-filters-inner">
              {/* Recherche */}
              <div className="cl-filter-item cl-filter-search">
                <FontAwesomeIcon icon={faSearch} className="cl-search-icon" />
                <input
                  type="text"
                  className="cl-input"
                  placeholder="Rechercher par titre ou norme…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  autoComplete="off"
                />
              </div>

              {/* Filtre statut */}
              <div className="cl-filter-item">
                <Form.Select
                  className="cl-select"
                  value={filterStatut}
                  onChange={e => setFilterStatut(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="actif">Actif</option>
                  <option value="archive">Archivé</option>
                </Form.Select>
              </div>

              {/* Filtre norme */}
              <div className="cl-filter-item">
                <Form.Select
                  className="cl-select"
                  value={filterNorme}
                  onChange={e => setFilterNorme(e.target.value)}
                >
                  <option value="">Toutes les normes</option>
                  {normes.map(n => (
                    <option key={n.id} value={n.id}>{n.code} — {n.nom}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Reset */}
              {(search || filterStatut || filterNorme) && (
                <button
                  className="cl-btn-reset"
                  onClick={() => { setSearch(''); setFilterStatut(''); setFilterNorme('') }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Erreur ── */}
      {erreur && (
        <Alert variant="danger" className="cl-alert">⚠ {erreur}</Alert>
      )}

      {/* ── Carte principale ── */}
      <div className="cl-card">

        {/* Toolbar : sélection + pagination par page */}
        <div className="cl-toolbar">
          <div className="cl-toolbar-left">
            {selected.size > 0 && (
              <motion.button
                className="cl-btn-delete-sel"
                onClick={handleDeleteSelected}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FontAwesomeIcon icon={faTrash} className="me-1" />
                Supprimer la sélection ({selected.size})
              </motion.button>
            )}
          </div>
          <div className="cl-toolbar-right">
            <label className="cl-pg-label">Lignes par page :</label>
            <Form.Select
              className="cl-pg-select"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Form.Select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="cl-loading">
            <Spinner animation="border" style={{ color: '#2d6a9f' }} />
            <span>Chargement…</span>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="cl-empty">
            <div className="cl-empty-icon">📋</div>
            <p>Aucune checklist trouvée.</p>
          </div>
        ) : (
          <div className="cl-table-wrapper">
            <Table striped hover className="cl-table" responsive>
              <thead>
                <tr>
                  <th className="cl-th-check">
                    <Form.Check
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th>TITRE</th>
                  <th>NORME</th>
                  <th>STATUT</th>
                  <th className="text-center">QUESTIONS</th>
                  <th>DATE</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(cl => (
                  <tr
                    key={cl.id}
                    className={selected.has(cl.id) ? 'cl-row-selected' : ''}
                  >
                    <td className="cl-td-check">
                      <Form.Check
                        type="checkbox"
                        checked={selected.has(cl.id)}
                        onChange={() => toggleOne(cl.id)}
                        aria-label={`Sélectionner ${cl.titre}`}
                      />
                    </td>
                    <td className="cl-td-titre">
                      <div className="cl-titre">{cl.titre}</div>
                      {cl.description && (
                        <div className="cl-desc">{cl.description}</div>
                      )}
                    </td>
                    <td className="cl-td-norme">
                      {cl.norme ? (
                        <>
                          <span className="cl-norme-code">{cl.norme.code}</span>
                          <span className="cl-norme-nom"> — {cl.norme.nom}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td><StatutBadge statut={cl.statut} /></td>
                    <td className="text-center">
                      {(cl.questions?.length > 0 || cl.questions_count > 0) ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            background: '#f1f5f9', color: '#1e3a5f', padding: '0.25rem 0.6rem',
                            borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600'
                          }}>
                            {cl.questions?.length || cl.questions_count} question(s)
                          </span>
                          <button
                            className="cl-action-btn"
                            style={{ background: '#eff6ff', color: '#2d6a9f', width: '28px', height: '28px' }}
                            onClick={() => handleViewQuestions(cl)}
                            title="Voir les questions"
                            aria-label="Voir les questions"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Aucune question</span>
                      )}
                    </td>
                    <td className="cl-td-date">{formatDate(cl.created_at)}</td>
                    <td className="cl-td-actions">
                      <button
                        className="cl-action-btn cl-action-edit"
                        onClick={() => setEditChecklist(cl)}
                        title="Modifier"
                        aria-label="Modifier la checklist"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="cl-action-btn cl-action-delete"
                        onClick={() => handleDelete(cl)}
                        title="Supprimer"
                        aria-label="Supprimer la checklist"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pageItems.length > 0 && (
          <div className="cl-pagination">
            <span className="cl-pg-info">
              Page {page} / {search.trim() ? localTotalPages : apiLastPg}
              &nbsp;·&nbsp;
              {search.trim() ? displayed.length : apiTotal} résultat{apiTotal !== 1 ? 's' : ''}
            </span>
            <div className="cl-pg-nav">
              <button
                className="cl-pg-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Page précédente"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                className="cl-pg-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={search.trim() ? page >= localTotalPages : page >= apiLastPg}
                aria-label="Page suivante"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Panneau latéral d'édition ── */}
      <AnimatePresence>
        {editChecklist && (
          <ChecklistEditPanel
            key={editChecklist.id}
            checklist={editChecklist}
            normes={normes}
            onClose={() => setEditChecklist(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
