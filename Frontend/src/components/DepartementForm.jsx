import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faSitemap } from '@fortawesome/free-solid-svg-icons'
import {
  useCreateDepartementMutation,
  useUpdateDepartementMutation,
} from '../store/api/departementsApi'
import { useGetUsersQuery } from '../store/api/usersApi'
import { useGetSecteursQuery } from '../store/api/secteursApi'
import '../pages/Checklist/ChecklistCreate.css'
import './DepartementForm.css'

const ENTREPRISE_ID = 1
const ROLES_RESPONSABLES = ['Responsable Département', 'Responsable Qualité']

export default function DepartementForm({ initialData, onClose, onSaved }) {
  const isEdit = Boolean(initialData)

  const [form, setForm] = useState({
    nom: '',
    description: '',
    responsable_id: '',
    secteur_id: '',
  })

  const { data: allUsers = [], isLoading: loadingUsers } = useGetUsersQuery({ per_page: 100 })
  const { data: secteurs = [], isLoading: loadingSecteurs } = useGetSecteursQuery()
  const [createDepartement] = useCreateDepartementMutation()
  const [updateDepartement] = useUpdateDepartementMutation()

  const usersLoaded = !loadingUsers
  const secteursLoaded = !loadingSecteurs
  const users = allUsers.filter((u) => ROLES_RESPONSABLES.includes(u.role?.name))

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [errGlobal, setErrGlobal] = useState('')

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
        await updateDepartement({ id: initialData.id, ...payload }).unwrap()
      } else {
        await createDepartement(payload).unwrap()
      }
      onSaved()
    } catch (err) {
      console.error('Erreur création département:', err)

      if (err.status === 422) {
        setErrors(err.data?.errors || {})
        setErrGlobal(err.data?.message || 'Données invalides.')
      } else if (err.status) {
        setErrGlobal(
          err.data?.message ||
          `Erreur serveur (${err.status}). Consultez les logs Laravel.`
        )
      } else {
        setErrGlobal('Impossible de contacter le serveur. Vérifiez que le backend Laravel est démarré.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      show={true}
      onHide={onClose}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
      className="checklist-create-modal"
    >
      <Modal.Body className="p-0">
        <div className="cc-container">
          {/* ── En-tête ── */}
          <div className="section-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h1 className="section-title">
                <i><FontAwesomeIcon icon={faSitemap} /></i>{' '}
                {isEdit ? 'Modifier le département' : 'Nouveau département'}
              </h1>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.85rem',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Fermer ✕
                </button>
              )}
            </div>
            <p className="section-description">
              {isEdit
                ? "Modifier les informations de ce département."
                : "Créez un nouveau département et associez-le à un secteur."}
            </p>
          </div>

          {/* ── Contenu ── */}
          <div className="checklist-content">
            {errGlobal && (
              <div className="alert alert-error" role="alert">
                <span>⚠</span> {errGlobal}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Nom */}
              <div className="field-group">
                <label htmlFor="dept-nom">
                  Nom du département <span className="required">*</span>
                </label>
                <input
                  id="dept-nom"
                  type="text"
                  className={`input-field ${errors.nom ? 'error' : ''}`}
                  value={form.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  placeholder="Ex : Ressources Humaines"
                  maxLength={255}
                />
                {errors.nom && (
                  <div className="field-error">
                    <span>⚠</span> {Array.isArray(errors.nom) ? errors.nom[0] : errors.nom}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="field-group">
                <label htmlFor="dept-description">Description</label>
                <textarea
                  id="dept-description"
                  className="textarea-field"
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez le rôle de ce département (optionnel)…"
                />
              </div>

              {/* Secteur */}
              <div className="field-group">
                <label htmlFor="dept-secteur">Secteur d'activité</label>
                {!secteursLoaded ? (
                  <div className="skeleton" style={{ height: 44 }} />
                ) : (
                  <select
                    id="dept-secteur"
                    className="select-field"
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
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Utilisé pour suggérer automatiquement les normes applicables.
                </div>
              </div>

              {/* Responsable */}
              <div className="field-group">
                <label htmlFor="dept-responsable">Responsable</label>
                {!usersLoaded ? (
                  <div className="skeleton" style={{ height: 44 }} />
                ) : (
                  <select
                    id="dept-responsable"
                    className="select-field"
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
                  <div className="field-error">
                    <span>⚠</span> {Array.isArray(errors.responsable_id) ? errors.responsable_id[0] : errors.responsable_id}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="card-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner" /> Enregistrement…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} /> Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}