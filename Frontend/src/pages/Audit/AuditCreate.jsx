/**
 * AuditCreate.jsx
 * ─────────────────────────────────────────────────────────────
 * Formulaire multi-étapes de création d'un audit.
 *
 * Étapes :
 *   1. Département (sélectionner le département audité)
 *   2. Checklist  (choisir une checklist active)
 *   3. Auditeur   (choisir un utilisateur avec rôle Auditeur)
 *   4. Informations (titre + date prévue) + Enregistrer / Planifier
 *
 * Props :
 *   onCreated(audit) — appelé après création réussie
 *   onCancel()       — retour à la liste
 */
import { useState, useEffect } from 'react'
import { Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardCheck, faArrowLeft, faArrowRight,
  faCheck, faCalendarCheck, faSave,
} from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { getDepartements } from '../../api/departements'
import { listChecklistsActives } from '../../api/checklists'
import { createAudit, planifierAudit } from '../../api/audits'
import client from '../../api/client'
import './AuditCreate.css'

const STEPS = [
  { label: 'Département' },
  { label: 'Checklist' },
  { label: 'Auditeur' },
  { label: 'Informations' },
]

export default function AuditCreate({ onCreated, onCancel }) {
  const [step, setStep] = useState(0)

  // ── Données des selects ──
  const [departements,  setDepartements]  = useState([])
  const [checklists,    setChecklists]    = useState([])
  const [auditeurs,     setAuditeurs]     = useState([])
  const [loadingCl,     setLoadingCl]     = useState(false)
  const [loadingUsers,  setLoadingUsers]  = useState(false)

  // ── Sélections ──
  const [selectedDept,  setSelectedDept]  = useState('')
  const [selectedCl,    setSelectedCl]    = useState(null)  // objet checklist
  const [selectedAuditeur, setSelectedAuditeur] = useState('')

  // ── Étape 4 ──
  const [titre,       setTitre]       = useState('')
  const [datePrevue,  setDatePrevue]  = useState('')

  // ── Soumission ──
  const [saving,     setSaving]     = useState(false)
  const [errGlobal,  setErrGlobal]  = useState('')
  const [errors,     setErrors]     = useState({})

  // ── Charger départements ──
  useEffect(() => {
    getDepartements()
      .then(data => setDepartements(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // ── Charger checklists actives (étape 2) ──
  useEffect(() => {
    if (step !== 1) return
    setLoadingCl(true)
    listChecklistsActives()
      .then(data => setChecklists(data))
      .catch(() => setChecklists([]))
      .finally(() => setLoadingCl(false))
  }, [step])

  // ── Charger auditeurs (étape 3) ──
  useEffect(() => {
    if (step !== 2) return
    setLoadingUsers(true)
    client.get('/users')
      .then(res => {
        const all = res.data?.data ?? res.data ?? []
        // On filtre côté frontend sur le rôle Auditeur
        const list = all.filter(u => u.role?.name === 'Auditeur')
        setAuditeurs(list)
      })
      .catch(() => setAuditeurs([]))
      .finally(() => setLoadingUsers(false))
  }, [step])

  // ── Pré-remplir le titre si une checklist est sélectionnée ──
  useEffect(() => {
    if (selectedCl && !titre) {
      setTitre(selectedCl.titre)
    }
  }, [selectedCl])

  // ── Validation par étape ──
  const canNext = () => {
    if (step === 0) return !!selectedDept
    if (step === 1) return !!selectedCl
    if (step === 2) return true  // auditeur optionnel à ce stade
    return false
  }

  const next = () => {
    setErrors({})
    setErrGlobal('')
    setStep(s => s + 1)
  }
  const prev = () => {
    setErrors({})
    setErrGlobal('')
    setStep(s => s - 1)
  }

  // ── Soumission — Brouillon ──
  const handleBrouillon = async () => {
    if (!titre.trim()) { setErrors({ titre: 'Le titre est requis.' }); return }
    setSaving(true); setErrGlobal('')
    try {
      const audit = await createAudit({
        checklist_id:  selectedCl.id,
        titre:         titre.trim(),
        departement_id: selectedDept || null,
        auditeur_id:   selectedAuditeur || null,
      })
      onCreated(audit)
    } catch (err) {
      setErrGlobal(err.response?.data?.message ?? 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  // ── Soumission — Planifier directement ──
  const handlePlanifier = async () => {
    const errs = {}
    if (!titre.trim())    errs.titre      = 'Le titre est requis.'
    if (!datePrevue)      errs.datePrevue = 'La date prévue est requise pour planifier.'
    if (!selectedDept)    errs.dept       = 'Le département est requis pour planifier.'
    if (!selectedAuditeur) errs.auditeur  = 'L\'auditeur est requis pour planifier.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true); setErrGlobal('')
    try {
      // Créer en brouillon puis planifier
      const audit = await createAudit({
        checklist_id:  selectedCl.id,
        titre:         titre.trim(),
        departement_id: selectedDept,
        auditeur_id:   selectedAuditeur,
        date_prevue:   datePrevue,
      })
      await planifierAudit(audit.id, {
        date_prevue:   datePrevue,
        departement_id: Number(selectedDept),
        auditeur_id:   Number(selectedAuditeur),
      })
      onCreated({ ...audit, statut: 'planifie' })
    } catch (err) {
      setErrGlobal(err.response?.data?.message ?? 'Erreur lors de la planification.')
    } finally {
      setSaving(false)
    }
  }

  const deptLabel   = departements.find(d => d.id === Number(selectedDept))?.nom ?? ''
  const auditeurLabel = auditeurs.find(u => u.id === Number(selectedAuditeur))?.name ?? ''

  return (
    <div className="ac-page">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-header-icon">
          <FontAwesomeIcon icon={faClipboardCheck} />
        </div>
        <div>
          <h1 className="ac-header-title">Nouvel Audit</h1>
          <p className="ac-header-sub">Étape {step + 1} sur {STEPS.length}</p>
        </div>
        <button className="ac-btn-back" onClick={onCancel}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Retour
        </button>
      </div>

      {/* Stepper */}
      <div className="ac-stepper">
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div className={`ac-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              <div className="ac-step-circle">
                {i < step ? <FontAwesomeIcon icon={faCheck} /> : i + 1}
              </div>
              <span className="ac-step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`ac-step-line ${i < step ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="ac-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="ac-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Étape 1 : Département ── */}
            {step === 0 && (
              <>
                <div className="ac-step-title">Sélectionner le département</div>
                <div className="ac-step-desc">Choisissez le département qui sera audité.</div>
                <div className="ac-form-group">
                  <label className="ac-label">Département <span className="ac-required">*</span></label>
                  <select
                    className={`ac-select ${errors.dept ? 'ac-invalid' : ''}`}
                    value={selectedDept}
                    onChange={e => { setSelectedDept(e.target.value); setErrors({}) }}
                  >
                    <option value="">— Choisir un département —</option>
                    {departements.map(d => (
                      <option key={d.id} value={d.id}>{d.nom}</option>
                    ))}
                  </select>
                  {errors.dept && <div className="ac-error-text">{errors.dept}</div>}
                </div>
              </>
            )}

            {/* ── Étape 2 : Checklist ── */}
            {step === 1 && (
              <>
                <div className="ac-step-title">Choisir une checklist</div>
                <div className="ac-step-desc">
                  Sélectionnez la checklist active à utiliser pour cet audit.
                </div>
                {loadingCl ? (
                  <div className="ac-cl-loading">
                    <Spinner size="sm" animation="border" className="me-2" />
                    Chargement des checklists…
                  </div>
                ) : checklists.length === 0 ? (
                  <div className="ac-cl-loading">Aucune checklist active disponible.</div>
                ) : (
                  <div className="ac-cl-grid">
                    {checklists.map(cl => (
                      <div
                        key={cl.id}
                        className={`ac-cl-item ${selectedCl?.id === cl.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCl(cl)}
                      >
                        <div className="ac-cl-radio">
                          {selectedCl?.id === cl.id && <div className="ac-cl-radio-dot" />}
                        </div>
                        <div>
                          <div className="ac-cl-info-title">{cl.titre}</div>
                          {cl.norme && (
                            <div className="ac-cl-info-norme">{cl.norme.code} — {cl.norme.nom}</div>
                          )}
                          <div className="ac-cl-info-qs">
                            {cl.questions?.length ?? '?'} question(s)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Étape 3 : Auditeur ── */}
            {step === 2 && (
              <>
                <div className="ac-step-title">Affecter un auditeur</div>
                <div className="ac-step-desc">
                  Choisissez l'utilisateur chargé de réaliser cet audit (rôle Auditeur).
                  Vous pouvez passer cette étape et affecter l'auditeur plus tard.
                </div>
                {loadingUsers ? (
                  <div className="ac-cl-loading">
                    <Spinner size="sm" animation="border" className="me-2" />
                    Chargement des auditeurs…
                  </div>
                ) : (
                  <div className="ac-form-group">
                    <label className="ac-label">Auditeur</label>
                    <select
                      className="ac-select"
                      value={selectedAuditeur}
                      onChange={e => setSelectedAuditeur(e.target.value)}
                    >
                      <option value="">— Affecter plus tard —</option>
                      {auditeurs.length === 0 && (
                        <option disabled>Aucun utilisateur avec le rôle Auditeur</option>
                      )}
                      {auditeurs.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {errors.auditeur && <div className="ac-error-text">{errors.auditeur}</div>}
                  </div>
                )}
              </>
            )}

            {/* ── Étape 4 : Informations ── */}
            {step === 3 && (
              <>
                <div className="ac-step-title">Informations de l'audit</div>
                <div className="ac-step-desc">
                  Donnez un titre à l'audit et optionnellement une date prévue.
                </div>

                {/* Récap */}
                <div className="ac-recap">
                  <div>📁 <strong>Département :</strong> {deptLabel || '—'}</div>
                  <div>📋 <strong>Checklist :</strong> {selectedCl?.titre}</div>
                  {selectedCl?.norme && <div>📐 <strong>Norme :</strong> {selectedCl.norme.code}</div>}
                  {auditeurLabel && <div>👤 <strong>Auditeur :</strong> {auditeurLabel}</div>}
                </div>

                <div className="ac-form-group">
                  <label className="ac-label">Titre <span className="ac-required">*</span></label>
                  <input
                    type="text"
                    className={`ac-input ${errors.titre ? 'ac-invalid' : ''}`}
                    value={titre}
                    onChange={e => { setTitre(e.target.value); setErrors(p => ({ ...p, titre: null })) }}
                    placeholder="Ex : Audit Qualité Production — Août 2026"
                    maxLength={255}
                  />
                  {errors.titre && <div className="ac-error-text">{errors.titre}</div>}
                </div>

                <div className="ac-form-group">
                  <label className="ac-label">Date prévue</label>
                  <input
                    type="date"
                    className={`ac-input ${errors.datePrevue ? 'ac-invalid' : ''}`}
                    value={datePrevue}
                    onChange={e => { setDatePrevue(e.target.value); setErrors(p => ({ ...p, datePrevue: null })) }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.datePrevue && <div className="ac-error-text">{errors.datePrevue}</div>}
                </div>

                {errGlobal && (
                  <Alert variant="danger" className="ac-global-error">⚠ {errGlobal}</Alert>
                )}
              </>
            )}

            {/* ── Navigation ── */}
            <div className="ac-nav-btns">
              {step > 0 ? (
                <button className="ac-btn-prev" onClick={prev} disabled={saving}>
                  <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Précédent
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button className="ac-btn-next" onClick={next} disabled={!canNext()}>
                  Suivant <FontAwesomeIcon icon={faArrowRight} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="ac-btn-brouillon"
                    onClick={handleBrouillon}
                    disabled={saving}
                  >
                    {saving ? <Spinner size="sm" animation="border" /> : (
                      <><FontAwesomeIcon icon={faSave} className="me-1" />Brouillon</>
                    )}
                  </button>
                  <button
                    className="ac-btn-submit"
                    onClick={handlePlanifier}
                    disabled={saving}
                  >
                    {saving ? <Spinner size="sm" animation="border" /> : (
                      <><FontAwesomeIcon icon={faCalendarCheck} className="me-1" />Planifier</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
