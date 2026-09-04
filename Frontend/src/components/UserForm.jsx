import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSave, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { useCreateUserMutation, useUpdateUserMutation } from '../store/api/usersApi'
import { useGetRolesQuery } from '../store/api/rolesApi'
import { useGetDepartementsQuery } from '../store/api/departementsApi'
// Using same layout as ChecklistCreate but retaining original classes where needed
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

  const { data: roles = [], isLoading: loadingRoles } = useGetRolesQuery()
  const { data: departements = [], isLoading: loadingDepartements } = useGetDepartementsQuery({ per_page: 100 })
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [errGlobal, setErrGlobal] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role_id: initialData.role?.id || '',
        departement_id: initialData.departement?.id || '',
        statut: initialData.statut || 'actif',
      })
    }
  }, [initialData])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    setErrGlobal('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setErrGlobal('')

    if (!form.name.trim() || !form.email.trim() || !form.role_id || !form.departement_id) {
      setErrGlobal('Veuillez remplir tous les champs obligatoires.')
      return
    }

    if (!isEdit && !form.password) {
      setErrGlobal('Le mot de passe est requis pour un nouvel utilisateur.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role_id: form.role_id,
        departement_id: form.departement_id,
        statut: form.statut,
      }
      if (form.password) payload.password = form.password

      if (isEdit) {
        await updateUser({ id: initialData.id, ...payload }).unwrap()
      } else {
        await createUser(payload).unwrap()
      }
      onSaved()
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.data?.errors || {})
        setErrGlobal(err.data?.message || 'Données invalides.')
      } else {
        setErrGlobal('Impossible de contacter le serveur.')
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
      scrollable
      backdrop="static"
      keyboard={false}
      dialogClassName="cl-modal-dialog"
    >
      <Modal.Body className="p-0">
        <div className="cc-container">
          {/* En-tête (même style que Nouvelle Checklist) */}
          <div className="section-header" style={{
            background: 'linear-gradient(135deg, var(--cc-navy) 0%, var(--cc-blue) 100%)',
            padding: '1.75rem 2rem',
            margin: '0',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h1 className="section-title" style={{ color: '#fff', fontSize: '1.35rem', margin: 0 }}>
                <i><FontAwesomeIcon icon={faUserShield} /></i> {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
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
            <p className="section-description" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
              {isEdit ? "Modifiez les informations et les droits d'accès de l'utilisateur." : "Créez un nouvel utilisateur et assignez-lui un rôle."}
            </p>
          </div>

          <div className="checklist-content" style={{ padding: '2rem', background: '#fff' }}>
            {errGlobal && (
              <div className="alert alert-danger" style={{ borderRadius: '12px', fontSize: '0.9rem', padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                ⚠ {errGlobal}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                  Nom complet <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="dp-form-control"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex : Ahmed Bennani"
                  style={errors.name ? { borderColor: '#ef4444' } : {}}
                />
                {errors.name && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.name[0]}</div>}
              </div>

              <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  className="dp-form-control"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="exemple@entreprise.com"
                  style={errors.email ? { borderColor: '#ef4444' } : {}}
                />
                {errors.email && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email[0]}</div>}
              </div>

              <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                  Mot de passe {!isEdit && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="password"
                  className="dp-form-control"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Nouveau mot de passe"}
                  style={errors.password ? { borderColor: '#ef4444' } : {}}
                />
                {errors.password && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password[0]}</div>}
              </div>

              <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                  Rôle <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="dp-form-control"
                  value={form.role_id}
                  onChange={(e) => handleChange('role_id', e.target.value)}
                  style={errors.role_id ? { borderColor: '#ef4444' } : {}}
                >
                  <option value="">-- Sélectionner un rôle --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {errors.role_id && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.role_id[0]}</div>}
              </div>

              <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                  Département <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="dp-form-control"
                  value={form.departement_id}
                  onChange={(e) => handleChange('departement_id', e.target.value)}
                  style={errors.departement_id ? { borderColor: '#ef4444' } : {}}
                >
                  <option value="">-- Sélectionner un département --</option>
                  {departements.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
                {errors.departement_id && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{errors.departement_id[0]}</div>}
              </div>

              {isEdit && (
                <div className="field-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                    Statut
                  </label>
                  <select
                    className="dp-form-control"
                    value={form.statut}
                    onChange={(e) => handleChange('statut', e.target.value)}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              )}

              <div className="card-footer" style={{ 
                marginTop: '2rem', 
                paddingTop: '1.5rem', 
                borderTop: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '1rem' 
              }}>
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--cc-navy) 0%, var(--cc-blue) 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {saving ? 'Enregistrement...' : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Enregistrer
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