/**
 * AuditDetail.jsx
 * ─────────────────────────────────────────────────────────────
 * Page de détail d'un audit.
 *
 * Affiche :
 *   • Header : titre, statut, boutons contextuels (Planifier / Démarrer / Clôturer)
 *   • Informations générales : checklist, norme, département, auditeur, RQ, dates
 *   • Progression (slot — données non disponibles tant que reponses est un stub)
 *   • Questions de la checklist utilisée
 *
 * Props :
 *   auditId      — ID de l'audit à afficher
 *   onBack()     — retour à la liste
 *   onRefresh()  — demander un rechargement de la liste
 */
import { useState, useEffect } from 'react'
import { Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardCheck, faArrowLeft, faBuilding, faUser,
  faCalendar, faListCheck, faCircleCheck, faCalendarCheck,
  faPlay, faLock,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import { getAudit, planifierAudit, demarrerAudit, cloturerAudit } from '../../api/audits'
import './AuditDetail.css'

const STATUT_CONFIG = {
  brouillon:  { label: 'Brouillon',  cls: 'ad-badge-brouillon',  dot: '⚪' },
  planifie:   { label: 'Planifié',   cls: 'ad-badge-planifie',   dot: '🔵' },
  en_cours:   { label: 'En cours',   cls: 'ad-badge-en_cours',   dot: '🟡' },
  termine:    { label: 'Terminé',    cls: 'ad-badge-termine',    dot: '🟢' },
  cloture:    { label: 'Clôturé',    cls: 'ad-badge-cloture',    dot: '🟣' },
}

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, cls: 'ad-badge-brouillon', dot: '⚪' }
  return <span className={`ad-badge ${cfg.cls}`}>{cfg.dot} {cfg.label}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AuditDetail({ auditId, onBack, onRefresh, defaultAction }) {
  const [audit,    setAudit]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [actioning,setActioning]= useState(false)

  useEffect(() => {
    setLoading(true)
    getAudit(auditId)
      .then(data => setAudit(data))
      .catch(() => setError('Impossible de charger l\'audit.'))
      .finally(() => setLoading(false))
  }, [auditId])

  const reload = () => {
    setLoading(true)
    getAudit(auditId)
      .then(data => { setAudit(data); onRefresh?.() })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // ── Action : Planifier ──
  const handlePlanifier = async () => {
    if (!audit.auditeur_id || !audit.departement_id || !audit.date_prevue) {
      Swal.fire('Impossible', 'Un auditeur, un département et une date prévue sont requis pour planifier.', 'warning')
      return
    }
    const result = await Swal.fire({
      title: 'Planifier cet audit ?',
      text: `L'audit passera au statut "Planifié".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Planifier',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#1d4ed8',
    })
    if (!result.isConfirmed) return
    setActioning(true)
    try {
      await planifierAudit(audit.id, {
        date_prevue:    audit.date_prevue,
        departement_id: audit.departement_id,
        auditeur_id:    audit.auditeur_id,
      })
      await reload()
      Swal.fire({ icon: 'success', title: 'Planifié !', timer: 1600, showConfirmButton: false })
    } catch (e) {
      Swal.fire('Erreur', e.response?.data?.message ?? 'Erreur lors de la planification.', 'error')
    } finally {
      setActioning(false)
    }
  }

  // ── Action : Démarrer ──
  const handleDemarrer = async () => {
    const result = await Swal.fire({
      title: 'Démarrer l\'audit ?',
      text: 'L\'audit passera au statut "En cours".',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Démarrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d97706',
    })
    if (!result.isConfirmed) return
    setActioning(true)
    try {
      await demarrerAudit(audit.id)
      await reload()
      Swal.fire({ icon: 'success', title: 'Démarré !', timer: 1600, showConfirmButton: false })
    } catch (e) {
      Swal.fire('Erreur', e.response?.data?.message ?? 'Erreur lors du démarrage.', 'error')
    } finally {
      setActioning(false)
    }
  }

  // ── Action : Clôturer ──
  const handleCloturer = async () => {
    const result = await Swal.fire({
      title: 'Clôturer l\'audit ?',
      text: 'Cette action est définitive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Clôturer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#7c3aed',
    })
    if (!result.isConfirmed) return
    setActioning(true)
    try {
      await cloturerAudit(audit.id)
      await reload()
      Swal.fire({ icon: 'success', title: 'Clôturé !', timer: 1600, showConfirmButton: false })
    } catch (e) {
      Swal.fire('Erreur', e.response?.data?.message ?? 'Erreur lors de la clôture.', 'error')
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="ad-loading">
        <Spinner animation="border" style={{ color: 'var(--color-primary, #3a8a90)' }} />
        Chargement…
      </div>
    )
  }

  if (error || !audit) {
    return <Alert variant="danger" className="m-4">{error || 'Audit introuvable.'}</Alert>
  }

  const questions = audit.checklist?.questions ?? []

  return (
    <motion.div
      className="ad-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Header ── */}
      <div className="ad-header">
        <div className="ad-header-left">
          <div className="ad-header-icon">
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <div>
            <h1 className="ad-header-title">{audit.titre}</h1>
            <p className="ad-header-sub">
              #{audit.id}
              <StatutBadge statut={audit.statut} />
            </p>
          </div>
        </div>
        <div className="ad-header-actions">
          <button className="ad-btn ad-btn-back" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} /> Retour
          </button>
          {audit.statut === 'brouillon' && (
            <button className="ad-btn ad-btn-plan" onClick={handlePlanifier} disabled={actioning}>
              <FontAwesomeIcon icon={faCalendarCheck} /> Planifier
            </button>
          )}
          {audit.statut === 'planifie' && (
            <button className="ad-btn ad-btn-start" onClick={handleDemarrer} disabled={actioning}>
              <FontAwesomeIcon icon={faPlay} /> Démarrer
            </button>
          )}
          {audit.statut === 'termine' && (
            <button className="ad-btn ad-btn-close" onClick={handleCloturer} disabled={actioning}>
              <FontAwesomeIcon icon={faLock} /> Clôturer
            </button>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="ad-body">

        {/* Informations générales */}
        <div className="ad-card">
          <div className="ad-card-header">
            <div className="ad-card-header-icon">
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <h2 className="ad-card-title">Informations générales</h2>
          </div>
          <div className="ad-card-body">
            <div className="ad-info-grid">
              <div className="ad-info-item">
                <span className="ad-info-label">Checklist</span>
                <span className="ad-info-value">{audit.checklist?.titre ?? '—'}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Norme</span>
                <span className="ad-info-value code">
                  {audit.checklist?.norme?.code ?? '—'}
                </span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Département</span>
                <span className="ad-info-value">
                  <FontAwesomeIcon icon={faBuilding} className="me-1" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                  {audit.departement?.nom ?? '—'}
                </span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Auditeur</span>
                <span className="ad-info-value">
                  <FontAwesomeIcon icon={faUser} className="me-1" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                  {audit.auditeur?.name ?? '—'}
                </span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Responsable Qualité</span>
                <span className="ad-info-value">{audit.responsable_qualite?.name ?? '—'}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Date prévue</span>
                <span className="ad-info-value">
                  <FontAwesomeIcon icon={faCalendar} className="me-1" style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                  {formatDate(audit.date_prevue)}
                </span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Date réalisation</span>
                <span className="ad-info-value">{formatDate(audit.date_realisation)}</span>
              </div>
              <div className="ad-info-item">
                <span className="ad-info-label">Statut</span>
                <span className="ad-info-value">
                  <StatutBadge statut={audit.statut} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="ad-card">
          <div className="ad-card-header">
            <div className="ad-card-header-icon">
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
            <h2 className="ad-card-title">Progression</h2>
          </div>
          <div className="ad-card-body">
            <div className="ad-progress-section">
              <div className="ad-progress-header">
                <span>Questions répondues</span>
                <span>— / {questions.length}</span>
              </div>
              <div className="ad-progress-bar">
                <div className="ad-progress-fill" style={{ width: '0%' }} />
              </div>
              <span className="ad-progress-note">
                La progression sera calculée une fois le module de réponses développé.
              </span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="ad-card">
          <div className="ad-card-header">
            <div className="ad-card-header-icon">
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <h2 className="ad-card-title">
              Questions de la checklist ({questions.length})
            </h2>
          </div>
          <div className="ad-card-body">
            {questions.length === 0 ? (
              <div className="ad-empty-questions">
                Aucune question dans cette checklist.
              </div>
            ) : (
              <div className="ad-questions-list">
                {questions.map((q, i) => (
                  <div key={q.id} className="ad-question-item">
                    <div className="ad-question-num">{i + 1}</div>
                    <div>
                      <div className="ad-question-text">{q.texte}</div>
                      {q.type && (
                        <div className="ad-question-type">Type : {q.type}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  )
}
