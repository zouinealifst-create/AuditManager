import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSave, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { createUser, updateUser } from '../services/userService'
import { getRoles } from '../services/roleService'
import { getDepartements } from '../services/departementService'
import './UserForm.css'

export default function UserForm({ initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    departement_id: '',
    statut: 'actif',
  })

  const [roles, setRoles] = useState([])
  const [rolesLoaded, setRolesLoaded] = useState(false)
  const [departements, setDepartements] = useState([])
  const [departementsLoaded, setDepartementsLoaded] = useState(false)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [errGlobal, setErrGlobal] = useState('')

  useEffect(() => {
    getRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setRoles([]))
      .finally(() => setRolesLoaded(true))

    getDepartements({ per_page: 100 })
      .then((data) => setDepartements(data.data ?? []))
      .catch(() => setDepartements([]))
      .finally(() => setDepartementsLoaded(true))
  }, [])

  useEffect(() => {
    setForm({
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      password: '',
      role_id: initialData?.role?.id ?? '',
      departement_id: initialData?.departement?.id ?? '',
      statut: initialData?.statut ?? 'actif',
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
    if (!form.name.trim()) localErrors.name = 'Le nom est requis.'
    if (!form.email.trim()) localErrors.email = "L'email est requis."
    if (!isEdit && !form.password.trim()) localErrors.password = 'Le mot de passe est requis.'
    if (!form.role_id) localErrors.role_id = 'Le rôle est requis.'
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: form.role_id,
      departement_id: form.departement_id || null,
      statut: form.statut,
    }
    if (form.password.trim()) {
      payload.password = form.password.trim()
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateUser(initialData.id, payload)
      } else {
        await createUser(payload)
      }
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setErrGlobal(err.response.data.message || 'Données invalides.')
      } else {
        setErrGlobal('Impossible de contacter le serveur.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        className="dp-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="dp-edit-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        <div className="dp-panel-header">
          <div className="dp-panel-header-title-wrap">
            <span className="dp-panel-header-icon">
              <FontAwesomeIcon icon={faUserShield} />
            </span>
            <div>
              <div className="dp-panel-header-title">
                {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </div>
              {isEdit && <div className="dp-panel-header-sub">#{initialData.id}</div>}
            </div>
          </div>
          <button className="dp-panel-close" onClick={onClose} aria-label="Fermer">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="dp-panel-body">
          {errGlobal && <div className="dp-panel-alert">⚠ {errGlobal}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="dp-form-group">
              <label className="dp-form-label">
                Nom complet <span className="dp-required">*</span>
              </label>
              <input
                type="text"
                className={`dp-form-control ${errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex : Ahmed Bennani"
              />
              {errors.name && (
                <div className="dp-field-error">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </div>
              )}
            </div>

            <div className="dp-form-group">
              <label className="dp-form-label">
                Email <span className="dp-required">*</span>
              </label>
              <input
                type="email"
                className={`dp-form-control ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="exemple@entreprise.com"
              />
              {errors.email && (
                <div className="dp-field-error">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </div>
              )}
            </div>

            <div className="dp-form-group">
              <label className="dp-form-label">
                Mot de passe {!isEdit && <span className="dp-required">*</span>}
              </label>
              <input
                type="password"
                className={`dp-form-control ${errors.password ? 'is-invalid' : ''}`}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Minimum 8 caractères'}
              />
              {errors.password && (
                <div className="dp-field-error">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </div>
              )}
            </div>

            <div className="dp-form-group">
              <label className="dp-form-label">
                Rôle <span className="dp-required">*</span>
              </label>
              {!rolesLoaded ? (
                <div className="dp-panel-loading">Chargement des rôles…</div>
              ) : (
                <select
                  className={`dp-form-control ${errors.role_id ? 'is-invalid' : ''}`}
                  value={form.role_id}
                  onChange={(e) => handleChange('role_id', e.target.value)}
                >
                  <option value="">— Choisir un rôle —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.role_id && (
                <div className="dp-field-error">
                  {Array.isArray(errors.role_id) ? errors.role_id[0] : errors.role_id}
                </div>
              )}
            </div>

            <div className="dp-form-group">
              <label className="dp-form-label">Département</label>
              {!departementsLoaded ? (
                <div className="dp-panel-loading">Chargement des départements…</div>
              ) : (
                <select
                  className="dp-form-control"
                  value={form.departement_id}
                  onChange={(e) => handleChange('departement_id', e.target.value)}
                >
                  <option value="">— Aucun département —</option>
                  {departements.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="dp-form-group">
              <label className="dp-form-label">Statut</label>
              <select
                className="dp-form-control"
                value={form.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            <div className="dp-panel-actions">
              <button type="button" className="dp-btn-cancel" onClick={onClose} disabled={saving}>
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