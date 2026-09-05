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
 *
 * Migration RTK Query :
 *   • useListChecklistsQuery       → cache 3 min, re-fetch auto sur filtres/page
 *   • useGetAllNormesQuery         → cache 10 min (catalogue stable)
 *   • useGetChecklistQuery         → utilisé ponctuellement pour charger questions
 *   • useDeleteChecklistMutation   → invalide la liste après suppression
 */
import { useState, useMemo, useEffect } from 'react'
import {
  Table, Form, Button, Spinner, Alert, Modal
} from 'react-bootstrap'
import { AnimatePresence, motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, faTrash, faFilter, faSearch, faPlus,
  faChevronLeft, faChevronRight, faLayerGroup, faEye,
} from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import { useListChecklistsQuery, useDeleteChecklistMutation, useGetChecklistQuery } from '../../store/api/checklistsApi'
import { useGetAllNormesQuery } from '../../store/api/normesApi'
import ChecklistEditPanel from '../../components/ChecklistEditPanel'
import ChecklistCreate from './ChecklistCreate'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../context/AuthContext'
import './ChecklistsListPage.css'

// ── Helpers ──────────────────────────────────────────────────

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', cls: 'cl-badge-brouillon' },
  actif:     { label: 'Actif',     cls: 'cl-badge-actif'     },
  archive:   { label: 'Archivé',   cls: 'cl-badge-archive'   },
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

// ── Sous-composant : chargeur de questions pour le popup ──────
// Isole l'appel useGetChecklistQuery pour respecter les règles des hooks
function ViewQuestionsLoader({ cl, onDone }) {
  const { data: detail } = useGetChecklistQuery(cl.id, {
    skip: !!cl.questions, // si les questions sont déjà dans le state local, on skip
  })
  const questions = cl.questions ?? detail?.questions
  // Affiche le modal dès que les données sont disponibles
  useMemo(() => {
    if (questions === undefined) return // encore en chargement
    onDone(questions)
  }, [questions]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ── Composant principal ──────────────────────────────────────
export default function ChecklistsListPage() {
  const [panelOpen, setPanelOpen] = useState(false)

  const { user } = useAuth()
  const canCreate = usePermission('checklists.create')
  const canEdit = usePermission('checklists.edit')
  const canDelete = usePermission('checklists.delete')
  const canManageAll = usePermission('checklists.manage_all')

  const canEditChecklist = (cl) => canEdit && (canManageAll || (user && cl.cree_par === user.id))
  const canDeleteChecklist = (cl) => canDelete && (canManageAll || (user && cl.cree_par === user.id))

  // ── Filtres ─────────────────────────────────────────────
  const [search,       setSearch]       = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterNorme,  setFilterNorme]  = useState('') // norme_id
  const [filtersOpen,  setFiltersOpen]  = useState(false)

  // ── Pagination ──────────────────────────────────────────
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ── Sélection ────────────────────────────────────────────
  const [selected, setSelected] = useState(new Set())

  // ── Édition ──────────────────────────────────────────────
  const [editChecklist,     setEditChecklist]     = useState(null)
  // Gestion du chargement des questions en popup (ID temporaire)
  const [viewQuestionsItem, setViewQuestionsItem] = useState(null)

  // ── Données RTK Query ────────────────────────────────────
  // Checklists : cache 3 min, re-fetch automatique quand filtres/page changent
  const {
    data: checklistsPage,
    isLoading: loading,
    isError,
    isFetching,
  } = useListChecklistsQuery({
    page,
    statut:   filterStatut || undefined,
    norme_id: filterNorme  || undefined,
  })

  const checklists = checklistsPage?.data     ?? []
  const apiTotal   = checklistsPage?.total    ?? 0
  const apiLastPg  = checklistsPage?.last_page ?? 1

  // Normes (catalogue complet, utilisé uniquement pour l'édition/création)
  const { data: normes = [] } = useGetAllNormesQuery()

  // ── Normes disponibles pour le filtre ────────────────────
  // On extrait uniquement les normes présentes dans les checklists affichées
  const normesDisponibles = useMemo(() => {
    const map = new Map()
    checklists.forEach(c => {
      if (c.norme && c.norme_id) {
        map.set(c.norme_id, c.norme)
      }
    })
    return Array.from(map.values()).sort((a, b) => 
      (a.code || '').localeCompare(b.code || '')
    )
  }, [checklists])

  // ── Mutation suppression ─────────────────────────────────
  const [deleteChecklist] = useDeleteChecklistMutation()

  // ── Filtrage local (statut + norme + recherche texte) ────────
  // Les filtres statut et norme sont appliqués ICI côté frontend car
  // le backend (/checklists sans auth:sanctum) ne filtre pas de façon fiable.
  // Les trois filtres sont combinables et s'appliquent dans cet ordre :
  //   1. statut     (comparaison exacte sur c.statut)
  //   2. norme      (comparaison exacte sur c.norme_id)
  //   3. texte      (recherche sur titre, code norme, nom norme)
  const displayed = useMemo(() => {
    let result = checklists

    // 1. Filtre statut
    if (filterStatut) {
      result = result.filter(c => c.statut === filterStatut)
    }

    // 2. Filtre norme (comparaison d'ID)
    if (filterNorme) {
      result = result.filter(c => String(c.norme_id) === String(filterNorme))
    }

    // 3. Filtre texte (titre + norme)
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(c =>
        c.titre?.toLowerCase().includes(q) ||
        c.norme?.code?.toLowerCase().includes(q) ||
        c.norme?.nom?.toLowerCase().includes(q)
      )
    }

    return result
  }, [checklists, search, filterStatut, filterNorme])

  // Pagination locale (découpe displayed selon pageSize)
  // On applique TOUJOURS le slice local, que le filtrage vienne d'une recherche
  // texte, d'un filtre statut ou d'un filtre norme.
  // Cela garantit que les trois filtres se combinent correctement et que
  // pageSize est toujours respecté.
  const localTotalPages = Math.max(1, Math.ceil(displayed.length / pageSize))
  const localPage  = Math.min(page, localTotalPages)
  const pageItems  = displayed.slice((localPage - 1) * pageSize, localPage * pageSize)

  // ── Sélection ────────────────────────────────────────────
  const allChecked = pageItems.length > 0 && pageItems.every(c => selected.has(c.id))
  const toggleAll  = () => {
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
      await deleteChecklist(cl.id).unwrap()
      // La liste est automatiquement invalidée via invalidatesTags
      setSelected(prev => { const s = new Set(prev); s.delete(cl.id); return s })
    } catch (error) {
      const msg = error.data?.message || 'Impossible de supprimer cette checklist.'
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
      try {
        await deleteChecklist(id).unwrap()
      } catch (error) {
        failed.push(id)
        if (error.data?.message) lastErrorMsg = error.data.message
      }
    }
    if (failed.length > 0) {
      const msg = lastErrorMsg ? `Dernière erreur : ${lastErrorMsg}` : `${failed.length} suppression(s) ont échoué.`
      Swal.fire('Attention', msg, 'warning')
    }
    setSelected(new Set(failed))
    // La liste RTK Query est automatiquement invalidée après chaque deleteChecklist
  }

  // ── Affichage des questions (Popup) ───────────────────────
  const handleViewQuestions = (cl) => {
    // Si questions déjà présentes dans l'objet → afficher directement
    if (cl.questions !== undefined) {
      showQuestionsModal(cl, cl.questions)
      return
    }
    // Sinon → déclencher le chargement via ViewQuestionsLoader
    setViewQuestionsItem(cl)
  }

  const showQuestionsModal = (cl, questions) => {
    setViewQuestionsItem(null) // reset le loader

    if (!questions || questions.length === 0) {
      Swal.fire('Questions', 'Aucune question pour cette checklist.', 'info')
      return
    }

    const getStatutCls = (st) => {
      if (st === 'actif')   return 'cl-badge-actif'
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
      customClass: { popup: 'cl-swal-popup' },
    })
  }

  // ── Après édition dans le panneau latéral ─────────────────
  const handleSaved = () => {
    setEditChecklist(null)
    refetch() // Forcer le rafraîchissement de la liste car updateChecklist n'est pas une mutation RTK Query
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="cl-page">
      {/* Chargeur silencieux pour questions en popup */}
      {viewQuestionsItem && (
        <ViewQuestionsLoader
          cl={viewQuestionsItem}
          onDone={(questions) => showQuestionsModal(viewQuestionsItem, questions)}
        />
      )}

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
              {isFetching && !loading && (
                <Spinner size="sm" animation="border" className="ms-2" style={{ width: '0.8rem', height: '0.8rem', color: '#2d6a9f' }} />
              )}
            </p>
          </div>
        </div>
        <div className="cl-header-right">
          <button
            className="cl-btn-filter"
            title="Filtres"
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
          >
            <FontAwesomeIcon icon={faFilter} />
            {(filterStatut || filterNorme) && <span className="cl-filter-dot" />}
          </button>
          {canCreate && (
            <button className="cl-btn-new" onClick={() => { setEditChecklist(null); setPanelOpen(true) }}>
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Nouvelle Checklist
            </button>
          )}
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
                  onChange={e => { setFilterStatut(e.target.value); setPage(1) }}
                >
                  <option value="">Tous les statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="actif">Actif</option>
                  <option value="archive">Archivé</option>
                </Form.Select>
              </div>

              {/* Filtre norme — uniquement les normes présentes */}
              <div className="cl-filter-item">
                <Form.Select
                  className="cl-select"
                  value={filterNorme}
                  onChange={e => { setFilterNorme(e.target.value); setPage(1) }}
                >
                  <option value="">Toutes les normes</option>
                  {normesDisponibles.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.code} {n.nom ? `— ${n.nom.substring(0, 40)}${n.nom.length > 40 ? '...' : ''}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Reset */}
              {(search || filterStatut || filterNorme) && (
                <button
                  className="cl-btn-reset"
                  onClick={() => { setSearch(''); setFilterStatut(''); setFilterNorme(''); setPage(1) }}
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Erreur ── */}
      {isError && (
        <Alert variant="danger" className="cl-alert">⚠ Impossible de charger les checklists.</Alert>
      )}

      {/* ── Carte principale ── */}
      <div className="cl-card">

        {/* Toolbar : sélection + pagination par page */}
        <div className="cl-toolbar">
          <div className="cl-toolbar-left">
            {selected.size > 0 && canDelete && (
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
                            borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
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
                      {canEditChecklist(cl) && (
                        <button
                          className="cl-action-btn cl-action-edit"
                          onClick={() => { setPanelOpen(false); setEditChecklist(cl) }}
                          title="Modifier"
                          aria-label="Modifier la checklist"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                      )}
                      {canDeleteChecklist(cl) && (
                        <button
                          className="cl-action-btn cl-action-delete"
                          onClick={() => handleDelete(cl)}
                          title="Supprimer"
                          aria-label="Supprimer la checklist"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
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
              Page {localPage} / {localTotalPages}
              &nbsp;·&nbsp;
              {displayed.length} résultat{displayed.length !== 1 ? 's' : ''}
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
                disabled={page >= localTotalPages}
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

      {/* ── Modale de Création (Checklist) ── */}
      <Modal
        show={panelOpen}
        onHide={() => setPanelOpen(false)}
        size="lg"
        centered
        scrollable
        dialogClassName="cl-modal-dialog"
      >
        <Modal.Body className="p-0">
          <ChecklistCreate
            onCancel={() => setPanelOpen(false)}
            onCreated={() => setPanelOpen(false)}
          />
        </Modal.Body>
      </Modal>

    </div>
  )
}
