import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faAddressBook,
  faFileContract,
  faChartSimple,
  faImage,
  faLocationDot,
  faPhone,
  faEnvelope,
  faGlobe,
  faIdCard,
  faSitemap,
  faCalendar,
  faUserGear,
  faFileLines,
  faToggleOn,
  faIndustry,
} from '@fortawesome/free-solid-svg-icons'
import { useGetEntrepriseQuery, useUpdateEntrepriseMutation } from '../../store/api/entreprisesApi'
import EntrepriseCard from '../../components/EntrepriseCard'
import './EntrepriseProfil.css'

const TABS = [
  { id: 'general', label: 'Informations générales', icon: faBuilding },
  { id: 'contact', label: 'Coordonnées', icon: faAddressBook },
  { id: 'legal', label: 'Informations légales', icon: faFileContract },
  { id: 'apercu', label: 'Aperçu', icon: faChartSimple },
]

const EMPTY_FORM = {
  nom: '',
  description: '',
  adresse: '',
  telephone: '',
  email: '',
  secteur_activite: '',
  statut: 'actif',
  ice: '',
  registre_commerce: '',
  site_web: '',
}

function InfoRow({ icon, label, value }) {
  const display =
    value === null || value === undefined || value === '' ? 'Non renseigné' : value
  return (
    <div className="info-row">
      <FontAwesomeIcon icon={icon} className="info-row-icon" />
      <div className="info-row-text">
        <span className="info-row-label">{label}</span>
        <span className="info-row-value">{display}</span>
      </div>
    </div>
  )
}

function FormField({ icon, label, error, children }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="input-with-icon">
        {icon && <FontAwesomeIcon icon={icon} />}
        {children}
      </div>
      {error && <span className="field-hint-error">{error}</span>}
    </div>
  )
}

function EntrepriseProfil() {
  const { data: entreprise, isLoading: fetching } = useGetEntrepriseQuery()
  const [updateEntreprise, { isLoading: loading }] = useUpdateEntrepriseMutation()

  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')

  // Pré-remplir le formulaire dès que les données arrivent
  useEffect(() => {
    if (!entreprise) return
    setForm({
      nom: entreprise.nom || '',
      description: entreprise.description || '',
      adresse: entreprise.adresse || '',
      telephone: entreprise.telephone || '',
      email: entreprise.email || '',
      secteur_activite: entreprise.secteur_activite || '',
      statut: entreprise.statut || 'actif',
      ice: entreprise.ice || '',
      registre_commerce: entreprise.registre_commerce || '',
      site_web: entreprise.site_web || '',
    })
  }, [entreprise])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGlobalError('')

    const payload = { ...form }
    if (logoFile) payload.logo = logoFile

    try {
      await updateEntreprise(payload).unwrap()
      setEditMode(false)
      setLogoFile(null)
      setLogoPreview(null)
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.data?.errors || {})
      } else {
        setGlobalError('Une erreur est survenue.')
      }
    }
  }

  const trackedFields = [
    'description', 'adresse', 'telephone', 'email',
    'secteur_activite', 'site_web', 'ice', 'registre_commerce',
  ]
  const filledCount = trackedFields.filter((f) => form[f]?.trim()).length
  const completion = Math.round((filledCount / trackedFields.length) * 100)

  if (fetching) return <p className="text-muted">Chargement...</p>

  if (!editMode && entreprise) {
    return <EntrepriseCard entreprise={entreprise} onEdit={() => setEditMode(true)} />
  }

  return (
    <div>
      <div className="profil-header">
        <div className="profil-header-icon">
          <FontAwesomeIcon icon={faBuilding} />
        </div>
        <h3>Modifier le profil de l'entreprise</h3>
      </div>

      <div className="card-clean">
        <div className="tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon-badge">
                <FontAwesomeIcon icon={tab.icon} />
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tabs-content">
            <div className="progress-block">
              <div style={{ width: '100%' }}>
                <div className="d-flex justify-content-between">
                  <span className="progress-label">Profil complété</span>
                  <span className="progress-percent">{completion} %</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>

            {globalError && <div className="alert-custom mb-3">{globalError}</div>}

            {activeTab === 'general' && (
              <div>
                <div className="tab-panel-intro">
                  <h6>Identité de l'entreprise</h6>
                  <p>Logo, nom et description générale.</p>
                </div>

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="logo-upload-preview">
                    {logoPreview || entreprise?.logo_url ? (
                      <img src={logoPreview || entreprise.logo_url} alt="Logo" />
                    ) : (
                      <FontAwesomeIcon icon={faImage} />
                    )}
                  </div>
                  <label className="btn-secondary-custom">
                    Choisir un logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
                  </label>
                </div>

                <div className="field-row">
                  <FormField icon={faBuilding} label="Nom" error={errors.nom?.[0]}>
                    <input
                      type="text"
                      name="nom"
                      className={errors.nom ? 'is-invalid' : ''}
                      value={form.nom}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField icon={faToggleOn} label="Statut">
                    <select name="statut" value={form.statut} onChange={handleChange}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </FormField>
                </div>

                <FormField icon={faFileLines} label="Description">
                  <textarea
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField icon={faIndustry} label="Secteur d'activité">
                  <input
                    type="text"
                    name="secteur_activite"
                    placeholder="Ex: Industrie, Santé, IT..."
                    value={form.secteur_activite}
                    onChange={handleChange}
                  />
                </FormField>
              </div>
            )}

            {activeTab === 'contact' && (
              <div>
                <div className="tab-panel-intro">
                  <h6>Coordonnées</h6>
                  <p>Comment vous contacter.</p>
                </div>

                <FormField icon={faLocationDot} label="Adresse">
                  <input type="text" name="adresse" value={form.adresse} onChange={handleChange} />
                </FormField>

                <div className="field-row">
                  <FormField icon={faPhone} label="Téléphone">
                    <input
                      type="text"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField icon={faEnvelope} label="Email" error={errors.email?.[0]}>
                    <input
                      type="email"
                      name="email"
                      className={errors.email ? 'is-invalid' : ''}
                      value={form.email}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField icon={faGlobe} label="Site web">
                  <input
                    type="text"
                    name="site_web"
                    placeholder="https://..."
                    value={form.site_web}
                    onChange={handleChange}
                  />
                </FormField>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <div className="tab-panel-intro">
                  <h6>Informations légales</h6>
                  <p>Identifiants officiels de l'entreprise.</p>
                </div>

                <div className="field-row">
                  <FormField icon={faIdCard} label="ICE">
                    <input type="text" name="ice" value={form.ice} onChange={handleChange} />
                  </FormField>

                  <FormField icon={faFileContract} label="Registre de Commerce">
                    <input
                      type="text"
                      name="registre_commerce"
                      value={form.registre_commerce}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'apercu' && (
              <div>
                <div className="tab-panel-intro">
                  <h6>Aperçu</h6>
                  <p>Statistiques générales de l'entreprise.</p>
                </div>

                <div className="info-row-grid">
                  <InfoRow
                    icon={faSitemap}
                    label="Nombre de départements"
                    value={entreprise?.nombre_departements ?? 0}
                  />
                  <InfoRow
                    icon={faCalendar}
                    label="Créée le"
                    value={
                      entreprise?.created_at
                        ? new Date(entreprise.created_at).toLocaleDateString('fr-FR')
                        : null
                    }
                  />
                  <InfoRow
                    icon={faUserGear}
                    label="Dernière mise à jour"
                    value={
                      entreprise?.updated_at
                        ? new Date(entreprise.updated_at).toLocaleDateString('fr-FR')
                        : null
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-footer-actions">
            <button type="submit" className="btn-teal" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button
              type="button"
              className="btn-secondary-custom"
              onClick={() => setEditMode(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EntrepriseProfil