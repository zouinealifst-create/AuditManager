/**
 * ChecklistCreate.jsx
 * ────────────────────────────────────────────────────────────
 * Écran de création d'une checklist pour le Responsable Qualité.
 *
 * Flux en 2 étapes :
 *   Étape 1 — Sélection département + norme + titre + description
 *   Étape 2 — Ajout/réorganisation/suppression de questions
 *             puis Enregistrer (brouillon) ou Publier
 *
 * Logique métier :
 *   - Le département expose son secteur_id
 *   - Les normes affichées = normes actives du secteur + universelles
 *   - selectedNormeId est UNIQUEMENT un état React (pas de BDD)
 *   - normes.statut n'est JAMAIS modifié
 *   - Pas d'entreprise_id envoyé (architecture single-tenant)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import './ChecklistCreate.css'
import { getDepartements } from '../../api/departements'
import { getNormesParSecteur } from '../../api/normes'
import { createChecklist, publierChecklist } from '../../api/checklists'
import { addQuestion } from '../../api/questions'

// ── Constantes ──────────────────────────────────────────────
const ETAPE = { SELECTION: 1, QUESTIONS: 2, SUCCES: 3 }
let _tempId = 0
const nextTempId = () => ++_tempId

// ── Composant principal ──────────────────────────────────────
export default function ChecklistCreate({ onCreated, onCancel } = {}) {
  // ── État global ──────────────────────────────────────────
  const [etape, setEtape] = useState(ETAPE.SELECTION)

  // Étape 1
  const [departements, setDepartements]       = useState([])
  const [selectedDeptId, setSelectedDeptId]   = useState('')
  const [normes, setNormes]                   = useState([])
  const [selectedNormeId, setSelectedNormeId] = useState(null)
  const [titre, setTitre]                     = useState('')
  const [description, setDescription]         = useState('')

  // Recherche + pagination normes
  const [normeSearch, setNormeSearch]           = useState('')
  const [normePage, setNormePage]               = useState(1)
  const [normesParPage, setNormesParPage]       = useState(10)

  // Étape 2
  const [checklistId, setChecklistId]   = useState(null)
  const [questions, setQuestions]       = useState([])
  const [nouvelleQuestion, setNouvelleQuestion] = useState('')
  const [successMessage, setSuccessMessage]     = useState('')

  // Loading / erreurs
  const [loadingDepts, setLoadingDepts]         = useState(true)
  const [loadingNormes, setLoadingNormes]       = useState(false)
  const [loadingContinuer, setLoadingContinuer] = useState(false)
  const [loadingSave, setLoadingSave]           = useState(false)
  const [loadingPublish, setLoadingPublish]     = useState(false)
  const [erreurGlobale, setErreurGlobale]       = useState('')
  const [erreurChamps, setErreurChamps]         = useState({}) // { titre: '...', norme_id: '...' }

  const questionInputRef = useRef(null)

  // ── Données dérivées ─────────────────────────────────────
  const selectedDept = departements.find(d => String(d.id) === String(selectedDeptId))
  const selectedNorme = normes.find(n => n.id === selectedNormeId)

  const peutContinuer =
    selectedDeptId &&
    selectedNormeId &&
    titre.trim().length > 0 &&
    !loadingContinuer

  // ── Chargement des départements ──────────────────────────
  useEffect(() => {
    setLoadingDepts(true)
    getDepartements()
      .then(data => setDepartements(data))
      .catch(() => setErreurGlobale('Impossible de charger la liste des départements.'))
      .finally(() => setLoadingDepts(false))
  }, [])

  // ── Chargement des normes quand département change ───────
  useEffect(() => {
    if (!selectedDeptId) {
      setNormes([])
      setSelectedNormeId(null)
      setNormeSearch('')
      setNormePage(1)
      return
    }
    if (!selectedDept?.secteur_id) {
      // Département sans secteur assigné
      setNormes([])
      setSelectedNormeId(null)
      setNormeSearch('')
      setNormePage(1)
      setErreurGlobale(
        `Le département "${selectedDept?.nom}" n'a pas de secteur assigné. Contactez un administrateur.`
      )
      return
    }
    setErreurGlobale('')
    setSelectedNormeId(null)
    setNormeSearch('')
    setNormePage(1)
    setLoadingNormes(true)
    getNormesParSecteur(selectedDept.secteur_id)
      .then(data => setNormes(data))
      .catch(() => setErreurGlobale('Impossible de charger les normes pour ce département.'))
      .finally(() => setLoadingNormes(false))
  }, [selectedDeptId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Étape 1 → Continuer ──────────────────────────────────
  const handleContinuer = async () => {
    setErreurGlobale('')
    setErreurChamps({})
    setLoadingContinuer(true)
    try {
      const checklist = await createChecklist({
        norme_id:    selectedNormeId,
        titre:       titre.trim(),
        description: description.trim() || null,
        statut:      'brouillon',
      })
      setChecklistId(checklist.id)
      setEtape(ETAPE.QUESTIONS)
    } catch (err) {
      if (err.response?.status === 422) {
        setErreurChamps(err.response.data.errors || {})
        setErreurGlobale(err.response.data.message || 'Données invalides.')
      } else if (err.response?.status === 403) {
        setErreurGlobale('Vous n\'êtes pas autorisé à effectuer cette opération.')
      } else {
        setErreurGlobale('Impossible de contacter le serveur.')
      }
    } finally {
      setLoadingContinuer(false)
    }
  }

  // ── Gestion questions locales ────────────────────────────
  const handleAjouterQuestion = () => {
    const texte = nouvelleQuestion.trim()
    if (!texte) return
    setQuestions(prev => [
      ...prev,
      { _id: nextTempId(), texte, ordre: prev.length + 1 },
    ])
    setNouvelleQuestion('')
    questionInputRef.current?.focus()
  }

  const handleSupprimerQuestion = useCallback((tempId) => {
    setQuestions(prev => {
      const filtered = prev.filter(q => q._id !== tempId)
      return filtered.map((q, i) => ({ ...q, ordre: i + 1 }))
    })
  }, [])

  const handleMonter = useCallback((index) => {
    if (index === 0) return
    setQuestions(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((q, i) => ({ ...q, ordre: i + 1 }))
    })
  }, [])

  const handleDescendre = useCallback((index) => {
    setQuestions(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((q, i) => ({ ...q, ordre: i + 1 }))
    })
  }, [])

  // ── Envoi séquentiel des questions ───────────────────────
  const envoyerQuestions = async () => {
    for (const q of questions) {
      await addQuestion(checklistId, { texte: q.texte, ordre: q.ordre })
    }
  }

  // ── Enregistrer brouillon ────────────────────────────────
  const handleEnregistrer = async () => {
    setErreurGlobale('')
    setLoadingSave(true)
    try {
      await envoyerQuestions()
      setSuccessMessage('Checklist enregistrée en brouillon avec succès.')
      setEtape(ETAPE.SUCCES)
    } catch (err) {
      if (err.response?.status === 403) {
        setErreurGlobale('Vous n\'êtes pas autorisé à effectuer cette opération.')
      } else {
        setErreurGlobale('Impossible de contacter le serveur.')
      }
    } finally {
      setLoadingSave(false)
    }
  }

  // ── Publier ──────────────────────────────────────────────
  const handlePublier = async () => {
    if (questions.length === 0) {
      setErreurGlobale('Ajoutez au moins une question avant de publier.')
      return
    }
    setErreurGlobale('')
    setLoadingPublish(true)
    try {
      await envoyerQuestions()
      await publierChecklist(checklistId)
      setSuccessMessage('Checklist publiée avec succès.')
      setEtape(ETAPE.SUCCES)
    } catch (err) {
      if (err.response?.status === 403) {
        setErreurGlobale('Vous n\'êtes pas autorisé à effectuer cette opération.')
      } else {
        setErreurGlobale('Impossible de contacter le serveur.')
      }
    } finally {
      setLoadingPublish(false)
    }
  }

  // ── Réinitialiser pour créer une autre checklist ─────────
  const handleReset = () => {
    setEtape(ETAPE.SELECTION)
    setSelectedDeptId('')
    setNormes([])
    setSelectedNormeId(null)
    setTitre('')
    setDescription('')
    setChecklistId(null)
    setQuestions([])
    setNouvelleQuestion('')
    setSuccessMessage('')
    setErreurGlobale('')
    setErreurChamps({})
  }

  // ── Rendu ────────────────────────────────────────────────
  return (
    <div className="container">
      {/* En-tête */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 className="section-title">
            <i>📋</i> Nouvelle Checklist
          </h1>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: '8px', padding: '0.4rem 0.9rem',
                fontSize: '0.85rem', color: 'var(--color-text-muted)', cursor: 'pointer',
              }}
            >
              ← Retour à la liste
            </button>
          )}
        </div>
        <p className="section-description">Créez une checklist d'audit liée à un département et une norme applicable.</p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="steps-indicator">
        <div className={`step-item ${etape >= ETAPE.SELECTION ? 'active' : ''}`}>
          <div className={`step-dot ${etape > ETAPE.SELECTION ? 'done' : etape === ETAPE.SELECTION ? 'active' : ''}`}>
            {etape > ETAPE.SELECTION ? '✓' : '1'}
          </div>
          <span className="step-label">Sélection</span>
        </div>

        <div className={`step-connector ${etape > ETAPE.SELECTION ? 'done' : ''}`} />

        <div className={`step-item ${etape >= ETAPE.QUESTIONS ? 'active' : ''}`}>
          <div className={`step-dot ${etape > ETAPE.QUESTIONS ? 'done' : etape === ETAPE.QUESTIONS ? 'active' : ''}`}>
            {etape > ETAPE.QUESTIONS ? '✓' : '2'}
          </div>
          <span className="step-label">Questions</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ÉTAPE 1 — Sélection                                */}
      {/* ═══════════════════════════════════════════════════ */}
      {etape === ETAPE.SELECTION && (
        <div className="checklist-content">
          {erreurGlobale && (
            <div className="alert alert-error" role="alert">
              <span>⚠</span> {erreurGlobale}
            </div>
          )}

          {/* Département */}
          <div className="field-group">
            <label htmlFor="select-dept">
              Département <span className="required">*</span>
            </label>
            {loadingDepts ? (
              <div className="skeleton" style={{ height: 44 }} />
            ) : (
              <select
                id="select-dept"
                className={`select-field ${erreurChamps.departement ? 'error' : ''}`}
                value={selectedDeptId}
                onChange={e => {
                  setSelectedDeptId(e.target.value)
                  setErreurGlobale('')
                }}
              >
                <option value="">— Choisir un département —</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                    {d.secteur ? ` (${d.secteur.nom})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Normes applicables */}
          {selectedDeptId && (
            <div className="normes-section">
              <div className="normes-section-title">
                Normes disponibles
                {selectedDept?.secteur && (
                  <span className="badge-secteur">{selectedDept.secteur.nom}</span>
                )}
              </div>

              {loadingNormes ? (
                <>
                  <div className="skeleton skeleton-row" />
                  <div className="skeleton skeleton-row" />
                  <div className="skeleton skeleton-row" />
                </>
              ) : normes.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <p>Aucune norme active trouvée pour ce secteur.</p>
                </div>
              ) : (() => {
                // ── Filtrage local ──────────────────────────────
                const q = normeSearch.trim().toLowerCase()
                const normesFiltrees = q
                  ? normes.filter(
                      n =>
                        n.code?.toLowerCase().includes(q) ||
                        n.nom?.toLowerCase().includes(q)
                    )
                  : normes

                // ── Pagination ──────────────────────────────────
                const totalPages = Math.max(1, Math.ceil(normesFiltrees.length / normesParPage))
                const pageSafe   = Math.min(normePage, totalPages)
                const debut      = (pageSafe - 1) * normesParPage
                const normesPage = normesFiltrees.slice(debut, debut + normesParPage)

                return (
                  <>
                    {/* Barre de recherche */}
                    <div className="normes-search-bar">
                      <input
                        id="input-norme-search"
                        type="text"
                        className="input-field"
                        placeholder="Rechercher par code ou nom de norme..."
                        value={normeSearch}
                        onChange={e => {
                          setNormeSearch(e.target.value)
                          setNormePage(1)
                        }}
                        autoComplete="off"
                      />
                      <span className="normes-count">
                        {normesFiltrees.length} norme{normesFiltrees.length !== 1 ? 's' : ''} disponible{normesFiltrees.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Liste paginée */}
                    {normesPage.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                        <p>Aucune norme ne correspond à votre recherche.</p>
                      </div>
                    ) : (
                      <div className="normes-list" role="radiogroup" aria-label="Sélection de la norme">
                        {normesPage.map(norme => (
                          <div
                            key={norme.id}
                            className={`norme-row ${selectedNormeId === norme.id ? 'selected' : ''}`}
                            onClick={() => setSelectedNormeId(norme.id)}
                            role="radio"
                            aria-checked={selectedNormeId === norme.id}
                            tabIndex={0}
                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedNormeId(norme.id)}
                          >
                            <div className="norme-radio">
                              <div className="norme-radio-dot" />
                            </div>
                            <div className="norme-info">
                              <div className="norme-code">{norme.code}</div>
                              <div className="norme-nom">{norme.nom}</div>
                              {(norme.version || norme.organisme) && (
                                <div className="norme-meta">
                                  {[norme.organisme, norme.version && `v${norme.version}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              )}
                            </div>
                            {norme.est_universelle && (
                              <span className="badge-universelle">Universelle</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contrôles de pagination */}
                    <div className="normes-pagination">
                      <div className="normes-pagination-left">
                        <label htmlFor="select-normes-par-page" className="pagination-label">
                          Lignes par page :
                        </label>
                        <select
                          id="select-normes-par-page"
                          className="select-field pagination-select"
                          value={normesParPage}
                          onChange={e => {
                            setNormesParPage(Number(e.target.value))
                            setNormePage(1)
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                      <div className="normes-pagination-right">
                        <button
                          className="btn btn-ghost btn-icon pagination-btn"
                          onClick={() => setNormePage(p => Math.max(1, p - 1))}
                          disabled={pageSafe <= 1}
                          aria-label="Page précédente"
                        >
                          ‹
                        </button>
                        <span className="pagination-info">
                          Page {pageSafe} / {totalPages}
                        </span>
                        <button
                          className="btn btn-ghost btn-icon pagination-btn"
                          onClick={() => setNormePage(p => Math.min(totalPages, p + 1))}
                          disabled={pageSafe >= totalPages}
                          aria-label="Page suivante"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {selectedNormeId && (
            <div className="alert alert-success" style={{ marginTop: '0.5rem' }}>
              <span>✓</span> Norme sélectionnée :{' '}
              <strong>{selectedNorme?.code} — {selectedNorme?.nom}</strong>
            </div>
          )}

          <hr className="section-divider" />

          {/* Titre */}
          <div className="field-group">
            <label htmlFor="input-titre">
              Titre de la checklist <span className="required">*</span>
            </label>
            <input
              id="input-titre"
              type="text"
              className={`input-field ${erreurChamps.titre ? 'error' : ''}`}
              placeholder="Ex : Audit qualité Production — T3 2026"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              maxLength={255}
            />
            {erreurChamps.titre && (
              <div className="field-error">
                <span>⚠</span> {Array.isArray(erreurChamps.titre) ? erreurChamps.titre[0] : erreurChamps.titre}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="field-group">
            <label htmlFor="input-description">Description</label>
            <textarea
              id="input-description"
              className="textarea-field"
              placeholder="Décrivez l'objectif de cette checklist (optionnel)…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Récapitulatif de sélection */}
          {(selectedDept || selectedNorme || titre) && (
            <div className="recap-bar">
              {selectedDept && (
                <div className="recap-item">
                  <span className="recap-label">Département</span>
                  <span className="recap-value">{selectedDept.nom}</span>
                </div>
              )}
              {selectedNorme && (
                <div className="recap-item">
                  <span className="recap-label">Norme</span>
                  <span className="recap-value norme">
                    {selectedNorme.code} — {selectedNorme.nom}
                  </span>
                </div>
              )}
              {titre && (
                <div className="recap-item">
                  <span className="recap-label">Titre</span>
                  <span className="recap-value">{titre}</span>
                </div>
              )}
            </div>
          )}

          <div className="card-footer">
            <button
              id="btn-continuer"
              className={`btn btn-primary ${!peutContinuer ? 'disabled-btn' : ''}`}
              onClick={handleContinuer}
              disabled={!peutContinuer}
            >
              {loadingContinuer
                ? <><span className="spinner" /> Création en cours…</>
                : <>Continuer →</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ÉTAPE 2 — Questions                                */}
      {/* ═══════════════════════════════════════════════════ */}
      {etape === ETAPE.QUESTIONS && (
        <div className="checklist-content">
          {/* Récapitulatif */}
          <div className="recap-bar">
            <div className="recap-item">
              <span className="recap-label">Checklist</span>
              <span className="recap-value">{titre}</span>
            </div>
            <div className="recap-item">
              <span className="recap-label">Norme</span>
              <span className="recap-value norme">
                {selectedNorme?.code} — {selectedNorme?.nom}
              </span>
            </div>
            <div className="recap-item">
              <span className="recap-label">Département</span>
              <span className="recap-value">{selectedDept?.nom}</span>
            </div>
          </div>

          {erreurGlobale && (
            <div className="alert alert-error" role="alert">
              <span>⚠</span> {erreurGlobale}
            </div>
          )}

          {/* Zone ajout */}
          <div className="field-group">
            <label htmlFor="input-question">
              Nouvelle question
            </label>
            <div className="question-add-zone">
              <input
                id="input-question"
                ref={questionInputRef}
                type="text"
                className="input-field"
                placeholder="Ex : Les procédures sont-elles documentées ?"
                value={nouvelleQuestion}
                onChange={e => setNouvelleQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAjouterQuestion()}
                maxLength={500}
              />
              <button
                id="btn-ajouter-question"
                className={`add-employee-button ${!nouvelleQuestion.trim() ? 'disabled-btn' : ''}`}
                onClick={handleAjouterQuestion}
                disabled={!nouvelleQuestion.trim()}
                style={{ margin: 0, width: 'auto' }}
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Liste des questions */}
          {questions.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
              <p>Aucune question ajoutée. Saisissez votre première question ci-dessus.</p>
            </div>
          ) : (
            <div className="questions-list" role="list">
              {questions.map((q, index) => (
                <div key={q._id} className="question-item" role="listitem">
                  <span className="question-ordre">{q.ordre}.</span>
                  <span className="question-texte">{q.texte}</span>
                  <div className="question-actions">
                    {/* Monter */}
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Monter"
                      onClick={() => handleMonter(index)}
                      disabled={index === 0}
                      aria-label="Déplacer la question vers le haut"
                    >
                      ↑
                    </button>
                    {/* Descendre */}
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Descendre"
                      onClick={() => handleDescendre(index)}
                      disabled={index === questions.length - 1}
                      aria-label="Déplacer la question vers le bas"
                    >
                      ↓
                    </button>
                    {/* Supprimer */}
                    <button
                      className="btn btn-danger-ghost btn-icon"
                      title="Supprimer"
                      onClick={() => handleSupprimerQuestion(q._id)}
                      aria-label="Supprimer la question"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card-footer">
            <button
              id="btn-enregistrer"
              className={`btn btn-ghost ${loadingSave || loadingPublish ? 'disabled-btn' : ''}`}
              onClick={handleEnregistrer}
              disabled={loadingSave || loadingPublish}
            >
              {loadingSave
                ? <><span className="spinner" style={{ borderTopColor: 'var(--color-primary)' }} /> Enregistrement…</>
                : '💾 Enregistrer (brouillon)'
              }
            </button>
            <button
              id="btn-publier"
              className={`btn btn-success ${loadingPublish || loadingSave || questions.length === 0 ? 'disabled-btn' : ''}`}
              onClick={handlePublier}
              disabled={loadingPublish || loadingSave || questions.length === 0}
              title={questions.length === 0 ? 'Ajoutez au moins une question pour publier' : ''}
            >
              {loadingPublish
                ? <><span className="spinner" /> Publication…</>
                : '🚀 Publier'
              }
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SUCCÈS                                              */}
      {/* ═══════════════════════════════════════════════════ */}
      {etape === ETAPE.SUCCES && (
        <div className="checklist-content">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h2>{successMessage}</h2>
            <p>
              La checklist <strong>«&nbsp;{titre}&nbsp;»</strong> a été créée
              avec <strong>{questions.length}</strong> question{questions.length > 1 ? 's' : ''}.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button id="btn-nouvelle-checklist" className="btn btn-primary" onClick={handleReset}>
                + Créer une autre checklist
              </button>
              {onCreated && (
                <button className="btn btn-ghost" onClick={onCreated}>
                  ← Retour à la liste
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
