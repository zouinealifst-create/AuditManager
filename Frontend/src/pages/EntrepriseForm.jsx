import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faLocationDot, faFileLines, faToggleOn } from '@fortawesome/free-solid-svg-icons'
import { getEntreprise, createEntreprise, updateEntreprise } from '../services/entrepriseService'
import './EntrepriseForm.css'

function EntrepriseForm() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const [form, setForm] = useState({
        nom: '',
        description: '',
        adresse: '',
        statut: 'actif',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [globalError, setGlobalError] = useState('')

    useEffect(() => {
        if (isEdit) {
        getEntreprise(id).then((data) => {
            setForm({
            nom: data.data.nom,
            description: data.data.description || '',
            adresse: data.data.adresse || '',
            statut: data.data.statut,
            })
        })
        }
    }, [id])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) {
        setErrors({ ...errors, [e.target.name]: '' })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        setGlobalError('')
        setLoading(true)

        try {
        if (isEdit) {
            await updateEntreprise(id, form)
        } else {
            await createEntreprise(form)
        }
        navigate('/entreprises')
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

    return (
        <div className="card-clean p-4" style={{ maxWidth: '600px' }}>
        <div className="form-header">
            <h5>{isEdit ? "Modifier l'entreprise" : 'Ajouter une entreprise'}</h5>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="mb-3">
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

            <div className="mb-3">
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

            {globalError && <div className="alert-custom">{globalError}</div>}

            <div className="form-actions">
            <button type="submit" className="btn-teal" disabled={loading}>
                {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
            <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => navigate('/entreprises')}
            >
                Annuler
            </button>
            </div>
        </form>
        </div>
    )
}

export default EntrepriseForm