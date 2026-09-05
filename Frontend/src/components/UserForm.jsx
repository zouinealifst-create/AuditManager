import { useState, useEffect, useMemo } from 'react'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSave, faUserShield, faEye, faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useCreateUserMutation, useUpdateUserMutation } from '../store/api/usersApi'
import { useGetRolesQuery } from '../store/api/rolesApi'
import { useGetDepartementsQuery } from '../store/api/departementsApi'
import { useGetPermissionsQuery } from '../store/api/permissionsApi'
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

  // Stocke les clés de permissions sous forme de Set pour une recherche/modification rapide (ex: 'checklists.view')
  const [selectedPermissions, setSelectedPermissions] = useState(new Set())

  const { data: roles = [], isLoading: loadingRoles } = useGetRolesQuery()
  const { data: departements = [], isLoading: loadingDepartements } = useGetDepartementsQuery({ per_page: 100 })
  const { data: allPermissions = [], isLoading: loadingPermissions } = useGetPermissionsQuery()

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
      if (initialData.permissions) {
        setSelectedPermissions(new Set(initialData.permissions))
      }
    }
  }, [initialData])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    setErrGlobal('')
  }

  const handleTogglePermission = (key, moduleKey, isViewToggle) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // Si on décoche "Voir", on décoche toutes les autres actions du module
        if (isViewToggle) {
          next.delete(`${moduleKey}.create`)
          next.delete(`${moduleKey}.edit`)
          next.delete(`${moduleKey}.delete`)
          next.delete(`${moduleKey}.manage_all`)
        }
      } else {
        next.add(key)
        // Si on coche une action (créer, modifier...), on coche automatiquement "Voir"
        if (!isViewToggle) {
          next.add(`${moduleKey}.view`)
        }
      }
      return next
    })
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

    // Convertir les clés en IDs pour le backend
    const permissionIds = allPermissions
      .filter(p => selectedPermissions.has(p.key))
      .map(p => p.id)

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role_id: form.role_id,
        departement_id: form.departement_id,
        statut: form.statut,
        permissions: permissionIds
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

  const modulesConfig = [
    { key: 'dashboard', label: 'Dashboard Admin', actions: ['view'] },
    { key: 'dashboard_rq', label: 'Dashboard Qualité (RQ)', actions: ['view'] },
    { key: 'entreprise', label: 'Mon Entreprise', actions: ['view', 'edit'] },
    { key: 'departements', label: 'Départements', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'users', label: 'Utilisateurs & Rôles', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'normes', label: 'Normes', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'checklists', label: 'Checklists', actions: ['view', 'create', 'edit', 'delete', 'manage_all'] },
    { key: 'audits', label: 'Audits', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'non-conformites', label: 'Non-conformités', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'actions_correctives', label: 'Actions correctives', actions: ['view', 'create', 'edit', 'delete'] }
  ]

  const ActionCheckbox = ({ moduleKey, action }) => {
    const key = `${moduleKey}.${action}`
    const hasView = selectedPermissions.has(`${moduleKey}.view`)
    const isChecked = selectedPermissions.has(key)

    // Vérifier si la permission existe en base de données pour ce module
    const exists = allPermissions.some(p => p.key === key)
    if (!exists) return <td className="text-center text-muted">—</td>

    return (
      <td className="text-center">
        <label className="perm-checkbox-label">
          <input
            type="checkbox"
            className="perm-checkbox"
            checked={isChecked}
            disabled={!hasView && action !== 'view'}
            onChange={() => handleTogglePermission(key, moduleKey, false)}
          />
          <span className="perm-custom-checkbox"></span>
        </label>
      </td>
    )
  }

  return (
    <Modal
      show={true}
      onHide={onClose}
      size="xl"
      centered
      scrollable
      backdrop="static"
      keyboard={false}
      dialogClassName="cl-modal-dialog"
    >
      <Modal.Body className="p-0">
        <div className="cc-container">
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
              {isEdit ? "Modifiez les informations et les droits d'accès de l'utilisateur." : "Créez un nouvel utilisateur et assignez-lui un rôle et des permissions."}
            </p>
          </div>

          <div className="checklist-content d-flex flex-column flex-lg-row" style={{ padding: '0', background: '#f8fafc' }}>
            {/* Colonne Informations de Base */}
            <div className="p-4" style={{ flex: '1', borderRight: '1px solid #e2e8f0', background: '#fff' }}>
              <h5 className="mb-4" style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem' }}>Informations de base</h5>
              
              {errGlobal && (
                <div className="alert alert-danger" style={{ borderRadius: '12px', fontSize: '0.9rem', padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                  ⚠ {errGlobal}
                </div>
              )}

              <form id="user-form" onSubmit={handleSubmit} noValidate>
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
              </form>
            </div>

            {/* Colonne Permissions */}
            <div className="p-4" style={{ flex: '1.8' }}>
              <div className="d-flex align-items-center mb-3">
                <FontAwesomeIcon icon={faUserShield} className="text-secondary me-2" />
                <h5 className="mb-0" style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accès & Permissions</h5>
              </div>
              
              <div className="mb-4" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', color: '#0369a1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <p className="mb-0 m-0">Activez le toggle pour donner accès à une page, puis cochez les actions autorisées. Tout part à zéro par défaut.</p>
              </div>

              {loadingPermissions ? (
                <div className="text-center p-5 text-muted">Chargement des permissions...</div>
              ) : (
                <div className="perm-table-container">
                  <table className="perm-table w-100">
                    <thead>
                      <tr>
                        <th>PAGE / MODULE</th>
                        <th className="text-center" width="100"><FontAwesomeIcon icon={faEye} className="me-2" style={{color:'#10b981'}}/>VOIR</th>
                        <th className="text-center" width="100"><FontAwesomeIcon icon={faPlus} className="me-2" style={{color:'#3b82f6'}}/>CRÉER</th>
                        <th className="text-center" width="100"><FontAwesomeIcon icon={faPen} className="me-2" style={{color:'#f59e0b'}}/>MODIFIER</th>
                        <th className="text-center" width="100"><FontAwesomeIcon icon={faTrash} className="me-2" style={{color:'#ef4444'}}/>SUPPRIMER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modulesConfig.map(mod => {
                        const viewKey = `${mod.key}.view`
                        const hasView = selectedPermissions.has(viewKey)
                        return (
                          <tr key={mod.key}>
                            <td style={{ fontWeight: 500, color: '#334155' }}>
                              <div className="d-flex align-items-center">
                                {/* Placeholder pour icônes des modules si besoin, ici on utilise un carré coloré ou l'icône */}
                                <div className="module-icon-ph"></div>
                                {mod.label}
                                
                                {/* Ligne spéciale pour Checklists : manage_all */}
                                {mod.key === 'checklists' && hasView && (
                                  <label className="ms-3 d-flex align-items-center mb-0" style={{fontSize: '0.8rem', cursor: 'pointer', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a'}}>
                                    <input 
                                      type="checkbox" 
                                      className="me-2"
                                      checked={selectedPermissions.has('checklists.manage_all')}
                                      onChange={() => handleTogglePermission('checklists.manage_all', 'checklists', false)}
                                    />
                                    Gérer toutes les checklists
                                  </label>
                                )}
                              </div>
                            </td>
                            
                            <td className="text-center">
                              <label className="perm-toggle">
                                <input
                                  type="checkbox"
                                  checked={hasView}
                                  onChange={() => handleTogglePermission(viewKey, mod.key, true)}
                                />
                                <span className="slider round"></span>
                              </label>
                            </td>

                            <ActionCheckbox moduleKey={mod.key} action="create" />
                            <ActionCheckbox moduleKey={mod.key} action="edit" />
                            <ActionCheckbox moduleKey={mod.key} action="delete" />
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card-footer" style={{ 
            padding: '1.5rem 2rem', 
            borderTop: '1px solid #e2e8f0', 
            background: '#fff',
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '1rem',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
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
              form="user-form"
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
                gap: '0.5rem',
                minWidth: '150px',
                justifyContent: 'center'
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
        </div>
      </Modal.Body>
    </Modal>
  )
}