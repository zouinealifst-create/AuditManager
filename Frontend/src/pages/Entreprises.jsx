import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { getEntreprises, deleteEntreprise } from '../services/entrepriseService'
import './Entreprises.css'

function Entreprises() {
    const [entreprises, setEntreprises] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchEntreprises = async () => {
        setLoading(true)
        try {
        const data = await getEntreprises()
        setEntreprises(data.data)
        } catch (err) {
        setError('Erreur lors du chargement des entreprises.')
        } finally {
        setLoading(false)
        }
    }

    useEffect(() => {
        fetchEntreprises()
    }, [])

    const handleDelete = async (id, nom) => {
        if (!confirm(`Supprimer l'entreprise "${nom}" ?`)) return
        try {
        await deleteEntreprise(id)
        fetchEntreprises()
        } catch (err) {
        alert('Erreur lors de la suppression.')
        }
    }

    if (loading) return <p className="text-muted">Chargement...</p>
    if (error) return <div className="alert-custom">{error}</div>

    return (
        <div>
        <div className="page-header d-flex justify-content-between align-items-center">
            <div>
            <div className="page-title">Liste des entreprises</div>
            <div className="page-subtitle">{entreprises.length} entreprise(s)</div>
            </div>

            <Link to="/entreprises/ajouter" className="btn-teal text-decoration-none">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Ajouter une entreprise
            </Link>
        </div>

        <div className="card-clean">
            <div className="table-responsive">
            <table className="table table-clean mb-0">
                <thead>
                <tr>
                    <th>Nom</th>
                    <th>Adresse</th>
                    <th>Statut</th>
                    <th>Départements</th>
                    <th className="text-end">Actions</th>
                </tr>
                </thead>
                <tbody>
                {entreprises.length === 0 && (
                    <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                        Aucune entreprise trouvée.
                    </td>
                    </tr>
                )}

                {entreprises.map((entreprise) => (
                    <tr key={entreprise.id}>
                    <td className="fw-medium">{entreprise.nom}</td>
                    <td>{entreprise.adresse || '-'}</td>
                    <td>
                        <span
                        className={
                            entreprise.statut === 'actif'
                            ? 'badge-status-actif'
                            : 'badge-status-inactif'
                        }
                        >
                        {entreprise.statut}
                        </span>
                    </td>
                    <td>{entreprise.nombre_departements}</td>
                    <td className="text-end">
                        <Link
                        to={`/entreprises/${entreprise.id}/modifier`}
                        className="btn-icon-action"
                        >
                        <FontAwesomeIcon icon={faPen} />
                        </Link>
                        <button
                        className="btn-icon-action danger"
                        onClick={() => handleDelete(entreprise.id, entreprise.nom)}
                        >
                        <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    )
}

export default Entreprises