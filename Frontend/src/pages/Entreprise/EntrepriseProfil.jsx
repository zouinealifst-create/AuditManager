import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBuilding,
    faLocationDot,
    faFileLines,
    faPhone,
    faEnvelope,
    faIndustry,
    faToggleOn,
} from '@fortawesome/free-solid-svg-icons'
import { getEntreprise, updateEntreprise } from '../../services/entrepriseService'
import './EntrepriseProfil.css'

function EntrepriseProfil() {
    const [form, setForm] = useState({
        nom: '',
        description: '',
        adresse: '',
        telephone: '',
        email: '',
        secteur_activite: '',
        statut: 'actif',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [success, setSuccess] = useState(false)
    const [globalError, setGlobalError] = useState('')

    useEffect(() => {
        getEntreprise()
        .then((data) => {
            setForm({
            nom: data.data.nom || '',
            description: data.data.description || '',
            adresse: data.data.adresse || '',
            telephone: data.data.telephone || '',
            email: data.data.email || '',
            secteur_activite: data.data.secteur_activite || '',
            statut: data.data.statut || 'actif',
            })
        })
        .finally(() => setFetching(false))
    }, [])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        setGlobalError('')
        setSuccess(false)
        setLoading(true)

        try {
        await updateEntreprise(form)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
        if (err.response?.status === 422) {
            setErrors(err.response.data.errors)
        } else {
            setGlobalError('Une erreur est survenue.')
        }
        } finally {
        setLoading(false)
        }
    }

    if (fetching) return <p className="text-muted">Chargement...</p>

    return (
        <div className="card-clean p-4" style={{ maxWidth: '700px' }}>
        <div className="form-header">
            <h5>Mon entreprise</h5>
            <small className="text-muted">Informations générales de votre entreprise</small>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="row">
            <div className="col-md-8 mb-3">
                <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faBuilding} />
                Nom
                </label>
                <input
                type="text"
                name="nom"
                className={`form-control-enhanced ${errors.nom ? 'is-invalid' : ''}`}
                value={form.nom}
                onChange={handleChange}
                />
                {errors.nom && <span className="error-message">{errors.nom[0]}</span>}
            </div>

            <div className="col-md-4 mb-3">
                <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faToggleOn} />
                Statut
                </label>
                <select
                name="statut"
                className="form-control-enhanced"
                value={form.statut}
                onChange={handleChange}
                >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                </select>
            </div>
            </div>

            <div className="mb-3">
            <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faFileLines} />
                Description
            </label>
            <textarea
                name="description"
                className="form-control-enhanced"
                rows="3"
                value={form.description}
                onChange={handleChange}
            />
            </div>

            <div className="mb-3">
            <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faLocationDot} />
                Adresse
            </label>
            <input
                type="text"
                name="adresse"
                className="form-control-enhanced"
                value={form.adresse}
                onChange={handleChange}
            />
            </div>

            <div className="row">
            <div className="col-md-6 mb-3">
                <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faPhone} />
                Téléphone
                </label>
                <input
                type="text"
                name="telephone"
                className="form-control-enhanced"
                value={form.telephone}
                onChange={handleChange}
                />
            </div>

            <div className="col-md-6 mb-3">
                <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faEnvelope} />
                Email
                </label>
                <input
                type="email"
                name="email"
                className={`form-control-enhanced ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={handleChange}
                />
                {errors.email && <span className="error-message">{errors.email[0]}</span>}
            </div>
            </div>

            <div className="mb-3">
            <label className="form-label-enhanced">
                <FontAwesomeIcon icon={faIndustry} />
                Secteur d'activité
            </label>
            <input
                type="text"
                name="secteur_activite"
                className="form-control-enhanced"
                placeholder="Ex: Industrie, Santé, IT..."
                value={form.secteur_activite}
                onChange={handleChange}
            />
            </div>

            {globalError && <div className="alert-custom">{globalError}</div>}
            {success && (
            <div className="alert alert-success py-2 mt-2">
                Informations mises à jour avec succès.
            </div>
            )}

            <div className="form-actions">
            <button type="submit" className="btn-teal" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            </div>
        </form>
        </div>
    )
}

export default EntrepriseProfil