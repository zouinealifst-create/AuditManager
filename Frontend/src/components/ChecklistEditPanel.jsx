/**
 * ChecklistEditPanel.jsx
 * ─────────────────────────────────────────────────────────────
 * Panneau latéral fixe d'édition d'une checklist existante.
 *
 * Props :
 *   checklist   – objet checklist à éditer (id, titre, description, statut, norme)
 *   normes      – tableau de toutes les normes pour le select
 *   onClose     – callback fermeture
 *   onSaved     – callback(updatedChecklist) après sauvegarde réussie
 *
 * Sections :
 *   1. Champs principaux : norme / titre / description / statut
 *      → bouton "Enregistrer" global (PUT /api/checklists/{id})
 *   2. Questions inline — chaque question a ses propres boutons :
 *      → disquette : PUT  /api/checklists/{id}/questions/{qid}
 *      → corbeille : DELETE /api/checklists/{id}/questions/{qid}
 *      → "+ Ajouter" : POST /api/checklists/{id}/questions
 */
import { useState, useEffect } from 'react'
import { Form, Button, Spinner, Alert } from 'react-bootstrap'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSave, faTrash, faPlus, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import { updateChecklist, getChecklist } from '../api/checklists'
import { getAllNormes, getNormesParSecteur } from '../api/normes'
import { addQuestion, updateQuestion, deleteQuestion } from '../api/questions'
import Swal from 'sweetalert2'
import './ChecklistEditPanel.css'

export default function ChecklistEditPanel({ checklist, onClose, onSaved }) {
  // ── Champs principaux ──────────────────────────────────────
  const [form, setForm] = useState({
    norme_id:    '',
    titre:       '',
    description: '',
    statut:      'brouillon',
  })
  const [saving,    setSaving]    = useState(false)
  const [errors,    setErrors]    = useState({})
  const [errGlobal, setErrGlobal] = useState('')

  // ── Normes — chargées localement dans le panel ─────────────
  const [normes,       setNormes]       = useState([])
  const [normesLoaded, setNormesLoaded] = useState(false)

  // ── Questions ──────────────────────────────────────────────
  const [questions, setQuestions] = useState([])
  const [qLoading,  setQLoading]  = useState(false)
  const [qTextes,   setQTextes]   = useState({})   // { [id]: texte courant }
  const [qSaving,   setQSaving]   = useState({})   // { [id]: true }
  const [newQTexte, setNewQTexte] = useState('')
  const [addingQ,   setAddingQ]   = useState(false)

  // ── Autocomplete norme ──
  const [normeSearch,       setNormeSearch]       = useState('')
  const [showNormeDropdown, setShowNormeDropdown] = useState(false)

  // ── Charger les normes filtrées par secteur du user connecté ──
  useEffect(() => {
    setNormesLoaded(false)

    // Lire le user depuis localStorage (stocké au login)
    let secteurId = null
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const user = JSON.parse(stored)
        secteurId = user?.departement?.secteur_id ?? null
      }
    } catch { /* ignore */ }

    const loader = secteurId
      ? getNormesParSecteur(secteurId)  // normes du secteur + universelles
      : getAllNormes()                   // fallback : toutes les normes

    loader
      .then(data => {
        setNormes(Array.isArray(data) ? data : [])
        setNormesLoaded(true)
      })
      .catch(() => setNormesLoaded(true))
  }, [])

  // ── Pré-remplir le formulaire quand checklist change ────────
  // Pré-remplir aussi le champ texte de recherche norme
  useEffect(() => {
    if (!checklist) return
    setForm({
      norme_id:    checklist.norme?.id    ?? '',
      titre:       checklist.titre        ?? '',
      description: checklist.description  ?? '',
      statut:      checklist.statut       ?? 'brouillon',
    })
    // Initialiser l'affichage texte de la norme actuelle
    if (checklist.norme) {
      setNormeSearch(`${checklist.norme.code} — ${checklist.norme.nom}`)
    } else {
      setNormeSearch('')
    }
    setErrors({})
    setErrGlobal('')
    // Charger les questions depuis l'API
    setQLoading(true)
    getChecklist(checklist.id)
      .then(detail => {
        const qs = detail.questions ?? []
        setQuestions(qs)
        const init = {}
        qs.forEach(q => { init[q.id] = q.texte })
        setQTextes(init)
      })
      .catch(() => setQuestions([]))
      .finally(() => setQLoading(false))
  }, [checklist])

  // Fix : re-sync norme_id si les normes arrivent après le pré-remplissage
  useEffect(() => {
    if (!checklist || !normesLoaded || normes.length === 0) return
    const normeId = checklist.norme?.id ?? ''
    setForm(prev => ({ ...prev, norme_id: normeId }))
  }, [normesLoaded])

  // ── Champs principaux ──────────────────────────────────────
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrGlobal('')
    setErrors({})

    const localErrors = {}
    if (!form.norme_id) localErrors.norme_id = 'La norme est requise.'
    if (!form.titre?.trim()) localErrors.titre = 'Le titre est requis.'
    if (Object.keys(localErrors).length > 0) { setErrors(localErrors); return }

    setSaving(true)
    try {
      const updated = await updateChecklist(checklist.id, {
        norme_id:    Number(form.norme_id),
        titre:       form.titre?.trim() || '',
        description: form.description?.trim() || null,
        statut:      form.statut,
      })
      onSaved(updated)
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la checklist:", err)
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setErrGlobal(err.response.data.message || 'Données invalides.')
      } else if (err.response?.status === 403) {
        setErrGlobal('Action non autorisée.')
      } else {
        setErrGlobal(err.message || 'Impossible de contacter le serveur.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Questions — édition inline ─────────────────────────────
  const handleQSave = async (q) => {
    const texte = (qTextes[q.id] ?? '').trim()
    if (!texte) return
    setQSaving(prev => ({ ...prev, [q.id]: true }))
    try {
      const updated = await updateQuestion(checklist.id, q.id, { texte })
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, texte: updated?.texte ?? texte } : x))
      setQTextes(prev => ({ ...prev, [q.id]: updated?.texte ?? texte }))
    } catch {
      Swal.fire('Erreur', 'Impossible de mettre à jour la question.', 'error')
    } finally {
      setQSaving(prev => ({ ...prev, [q.id]: false }))
    }
  }

  const handleQDelete = async (q) => {
    const result = await Swal.fire({
      title: 'Supprimer la question ?',
      html: `<b>${q.texte}</b>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
    })
    if (!result.isConfirmed) return
    try {
      await deleteQuestion(checklist.id, q.id)
      setQuestions(prev => prev.filter(x => x.id !== q.id))
      setQTextes(prev => { const s = { ...prev }; delete s[q.id]; return s })
    } catch {
      Swal.fire('Erreur', 'Impossible de supprimer la question.', 'error')
    }
  }

  const handleQAdd = async () => {
    const texte = newQTexte.trim()
    if (!texte) return
    setAddingQ(true)
    try {
      const created = await addQuestion(checklist.id, { texte, ordre: questions.length + 1 })
      setQuestions(prev => [...prev, created])
      setQTextes(prev => ({ ...prev, [created.id]: created.texte }))
      setNewQTexte('')
    } catch {
      Swal.fire('Erreur', 'Impossible d\'ajouter la question.', 'error')
    } finally {
      setAddingQ(false)
    }
  }

  if (!checklist) return null

  return (
    <>
      {/* Overlay semi-transparent */}
      <motion.div
        className="cl-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panneau latéral */}
      <motion.div
        className="cl-edit-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        {/* Header */}
        <div className="cl-panel-header">
          <div>
            <div className="cl-panel-header-title">Modifier la checklist</div>
            <div className="cl-panel-header-sub">#{checklist.id}</div>
          </div>
          <button className="cl-panel-close" onClick={onClose} aria-label="Fermer">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="cl-panel-body">
          {errGlobal && (
            <Alert variant="danger" className="cl-panel-alert">
              ⚠ {errGlobal}
            </Alert>
          )}

          {/* ── Section 1 : champs principaux ── */}
          <Form onSubmit={handleSubmit} noValidate>
            {/* Norme — autocomplete recherchable */}
            <Form.Group className="cl-form-group" controlId="edit-norme">
              <Form.Label className="cl-form-label">
                Norme <span className="cl-required">*</span>
              </Form.Label>
              {!normesLoaded ? (
                <div className="cl-panel-loading-normes">
                  <Spinner size="sm" animation="border" className="me-2" />
                  Chargement des normes…
                </div>
              ) : (
                <div className="cl-norme-autocomplete">
                  <input
                    className={`cl-form-control cl-norme-search-input${errors.norme_id ? ' is-invalid' : ''}`}
                    placeholder="Rechercher une norme (code ou nom)…"
                    value={normeSearch}
                    onChange={e => {
                      setNormeSearch(e.target.value)
                      setShowNormeDropdown(true)
                      // Désélectionner si l'utilisateur tape autre chose
                      setForm(prev => ({ ...prev, norme_id: '' }))
                    }}
                    onFocus={() => setShowNormeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowNormeDropdown(false), 180)}
                    autoComplete="off"
                  />
                  {showNormeDropdown && normeSearch.length >= 2 && (
                    <div className="cl-norme-dropdown">
                      {normes
                        .filter(n =>
                          n.code.toLowerCase().includes(normeSearch.toLowerCase()) ||
                          n.nom.toLowerCase().includes(normeSearch.toLowerCase())
                        )
                        .slice(0, 50)
                        .map(n => (
                          <div
                            key={n.id}
                            className={`cl-norme-option${form.norme_id === n.id ? ' selected' : ''}`}
                            onMouseDown={() => {
                              handleChange('norme_id', n.id)
                              setNormeSearch(`${n.code} — ${n.nom}`)
                              setShowNormeDropdown(false)
                            }}
                          >
                            <span className="cl-norme-option-code">{n.code}</span>
                            <span className="cl-norme-option-nom">{n.nom}</span>
                          </div>
                        ))
                      }
                      {normes.filter(n =>
                        n.code.toLowerCase().includes(normeSearch.toLowerCase()) ||
                        n.nom.toLowerCase().includes(normeSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="cl-norme-empty">Aucune norme trouvée</div>
                      )}
                    </div>
                  )}
                  {errors.norme_id && (
                    <div className="invalid-feedback d-block">
                      {Array.isArray(errors.norme_id) ? errors.norme_id[0] : errors.norme_id}
                    </div>
                  )}
                </div>
              )}
            </Form.Group>

            {/* Titre */}
            <Form.Group className="cl-form-group" controlId="edit-titre">
              <Form.Label className="cl-form-label">
                Titre <span className="cl-required">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={form.titre}
                onChange={e => handleChange('titre', e.target.value)}
                isInvalid={!!errors.titre}
                maxLength={255}
                placeholder="Titre de la checklist"
                className="cl-form-control"
              />
              {errors.titre && (
                <Form.Control.Feedback type="invalid">
                  {Array.isArray(errors.titre) ? errors.titre[0] : errors.titre}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {/* Description */}
            <Form.Group className="cl-form-group" controlId="edit-description">
              <Form.Label className="cl-form-label">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Description optionnelle…"
                className="cl-form-control"
              />
            </Form.Group>

            {/* Statut */}
            <Form.Group className="cl-form-group" controlId="edit-statut">
              <Form.Label className="cl-form-label">Statut</Form.Label>
              <Form.Select
                value={form.statut}
                onChange={e => handleChange('statut', e.target.value)}
                className="cl-form-control"
              >
                <option value="brouillon">Brouillon</option>
                <option value="actif">Actif</option>
                <option value="archive">Archivé</option>
              </Form.Select>
            </Form.Group>

            {/* Actions principales */}
            <div className="cl-panel-actions">
              <Button
                variant="outline-secondary"
                onClick={onClose}
                disabled={saving}
                className="cl-btn-cancel"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="cl-btn-save"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </Form>

          {/* ── Séparateur ── */}
          <div className="cl-panel-divider" />

          {/* ── Section 2 : Questions ── */}
          <div className="cl-panel-questions">
            <div className="cl-panel-q-header">
              Questions
              <span className="cl-panel-q-count">{questions.length}</span>
            </div>

            {qLoading ? (
              <div className="cl-panel-q-loading">
                <Spinner size="sm" animation="border" className="me-2" />
                Chargement…
              </div>
            ) : questions.length === 0 ? (
              <p className="cl-panel-q-empty">Aucune question pour l'instant.</p>
            ) : (
              <div className="cl-panel-q-list">
                {questions.map((q, idx) => (
                  <div key={q.id} className="cl-panel-q-item">
                    <span className="cl-panel-q-num">{idx + 1}</span>
                    <input
                      className="cl-panel-q-input"
                      value={qTextes[q.id] ?? q.texte}
                      onChange={e => setQTextes(prev => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleQSave(q)}
                      placeholder="Texte de la question…"
                    />
                    <button
                      className="cl-panel-q-btn cl-panel-q-btn-save"
                      onClick={() => handleQSave(q)}
                      disabled={qSaving[q.id]}
                      title="Enregistrer"
                      type="button"
                    >
                      {qSaving[q.id]
                        ? <Spinner size="sm" animation="border" />
                        : <FontAwesomeIcon icon={faFloppyDisk} />
                      }
                    </button>
                    <button
                      className="cl-panel-q-btn cl-panel-q-btn-delete"
                      onClick={() => handleQDelete(q)}
                      title="Supprimer"
                      type="button"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter une question */}
            <div className="cl-panel-q-add">
              <input
                className="cl-panel-q-input"
                value={newQTexte}
                onChange={e => setNewQTexte(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQAdd()}
                placeholder="Nouvelle question…"
              />
              <button
                className="cl-panel-q-btn-add"
                onClick={handleQAdd}
                disabled={addingQ || !newQTexte.trim()}
                type="button"
              >
                {addingQ
                  ? <Spinner size="sm" animation="border" />
                  : <><FontAwesomeIcon icon={faPlus} className="me-1" />Ajouter</>
                }
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
