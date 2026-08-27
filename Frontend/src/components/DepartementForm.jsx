import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSave, faSitemap } from '@fortawesome/free-solid-svg-icons'
import { createDepartement, updateDepartement } from '../services/departementService'
import { getUsers } from '../services/userService'
import { getSecteurs } from '../services/secteurService'
import './DepartementForm.css'

// Single-tenant : l'app ne gère qu'une seule entreprise (voir entrepriseService.js)
const ENTREPRISE_ID = 1

export default function DepartementForm({ initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData)

  const [form, setForm] = useState({
    nom: '',
    description: '',
    responsable_id: '',
    secteur_id: '',
  })

  const [users, setUsers] = useState([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [secteurs, setSecteurs] = useState([])
  const [secteursLoaded, setSecteursLoaded] = useState(false)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [errGlobal, setErrGlobal] = useState('')

  // ── Charger la liste des utilisateurs pour le select responsable ──
  useEffect(() => {
    getUsers({ per_page: 100 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? []
        // On ne garde que les utilisateurs ayant le rôle "Responsable Département"
        const responsables = list.filter((u) => u.role?.name === 'Responsable Département')
        setUsers(responsables)
      })
      .catch(() => setUsers([]))
      .finally(() => setUsersLoaded(true))
  }, [])

  // ── Charger la liste des secteurs pour le select secteur ──
  useEffect(() => {
    getSecteurs()
      .then((data) => setSecteurs(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setSecteurs([]))
      .finally(() => setSecteursLoaded(true))
  }, [])

  // ── Pré-remplir le formulaire ──
  useEffect(() => {
    setForm({
      nom: initialData?.nom ?? '',
      description: initialData?.description ?? '',
      responsable_id: initialData?.responsable?.id ?? '',
      secteur_id: initialData?.secteur?.id ?? '',
    })
    setErrors({})
    setErrGlobal('')
  }, [initialData])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrGlobal('')
    setErrors({})

    const localErrors = {}
    if (!form.nom.trim()) localErrors.nom = 'Le nom est requis.'
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    const payload = {
      entreprise_id: ENTREPRISE_ID,
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      responsable_id: form.responsable_id || null,
      secteur_id: form.secteur_id || null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateDepartement(initialData.id, payload)
      } else {
        await createDepartement(payload)
      }
      onSaved()
      } catch (err) {
    console.error('Erreur création département:', err)

    if (err.response?.status === 422) {
      setErrors(err.response.data.errors || {})
      setErrGlobal(err.response.data.message || 'Données invalides.')
    } else if (err.response) {
      setErrGlobal(
        err.response.data?.message ||
        `Erreur serveur (${err.response.status}). Consultez les logs Laravel.`
      )
    } else if (err.request) {
      setErrGlobal('Impossible de contacter le serveur. Vérifiez que le backend Laravel est démarré.')
    } else {
      setErrGlobal('Une erreur inattendue est survenue.')
    }
  } finally {
    setSaving(false)
  }
  }

  return (
    <>
      {/* Overlay semi-transparent */}
      <motion.div
        className="dp-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panneau latéral */}
      <motion.div
        className="dp-edit-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        {/* Header */}
        <div className="dp-panel-header">
          <div className="dp-panel-header-title-wrap">
            <span className="dp-panel-header-icon">
              <FontAwesomeIcon icon={faSitemap} />
            </span>
            <div>
              <div className="dp-panel-header-title">
                {isEdit ? 'Modifier le département' : 'Nouveau département'}
              </div>
              {isEdit && <div className="dp-panel-header-sub">#{initialData.id}</div>}
            </div>
          </div>
          <button className="dp-panel-close" onClick={onClose} aria-label="Fermer">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="dp-panel-body">
          {errGlobal && (
            <div className="dp-panel-alert">⚠ {errGlobal}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Nom */}
            <div className="dp-form-group">
              <label className="dp-form-label" htmlFor="dept-nom">
                Nom du département <span className="dp-required">*</span>
              </label>
              <input
                id="dept-nom"
                type="text"
                className={`dp-form-control ${errors.nom ? 'is-invalid' : ''}`}
                value={form.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex : Ressources Humaines"
                maxLength={255}
              />
              {errors.nom && (
                <div className="dp-field-error">
                  {Array.isArray(errors.nom) ? errors.nom[0] : errors.nom}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="dp-form-group">
              <label className="dp-form-label" htmlFor="dept-description">
                Description
              </label>
              <textarea
                id="dept-description"
                className="dp-form-control"
                rows={4}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez le rôle de ce département (optionnel)…"
              />
            </div>


            {/* Secteur */}
            <div className="dp-form-group">
              <label className="dp-form-label" htmlFor="dept-secteur">
                Secteur d'activité
              </label>
              {!secteursLoaded ? (
                <div className="dp-panel-loading">Chargement des secteurs…</div>
              ) : (
                <select
                  id="dept-secteur"
                  className="dp-form-control"
                  value={form.secteur_id}
                  onChange={(e) => handleChange('secteur_id', e.target.value)}
                >
                  <option value="">— Sans secteur —</option>
                  {secteurs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              )}
              <div className="dp-field-hint">
                Utilisé pour suggérer automatiquement les normes applicables.
              </div>
            </div>

            {/* Responsable */}
            <div className="dp-form-group">
              <label className="dp-form-label" htmlFor="dept-responsable">
                Responsable
              </label>
              {!usersLoaded ? (
                <div className="dp-panel-loading">Chargement des utilisateurs…</div>
              ) : (
                <select
                  id="dept-responsable"
                  className="dp-form-control"
                  value={form.responsable_id}
                  onChange={(e) => handleChange('responsable_id', e.target.value)}
                >
                  <option value="">— Aucun responsable —</option>
                  {users.length === 0 && (
                    <option disabled>Aucun utilisateur avec le rôle "Responsable Département"</option>
                  )}
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.responsable_id && (
                <div className="dp-field-error">
                  {Array.isArray(errors.responsable_id) ? errors.responsable_id[0] : errors.responsable_id}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="dp-panel-actions">
              <button
                type="button"
                className="dp-btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Annuler
              </button>
              <button type="submit" className="dp-btn-save" disabled={saving}>
                {saving ? (
                  <>
                    <span className="dp-spinner" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}