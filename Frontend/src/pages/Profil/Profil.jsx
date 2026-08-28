import { useAuth } from '../../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCircleUser,
    faEnvelope,
    faUserShield,
    faSitemap,
    faToggleOn,
    faIdBadge,
} from '@fortawesome/free-solid-svg-icons'
import './Profil.css'

const ROLE_BADGE_CLASS = {
    'Admin': 'us-badge-admin',
    'Responsable Qualité': 'us-badge-rq',
    'Auditeur': 'us-badge-audit',
    'Responsable Département': 'us-badge-rd',
}

function InfoRow({ icon, label, children }) {
    return (
        <div className="profil-info-row">
        <FontAwesomeIcon icon={icon} className="profil-info-icon" />
        <div className="profil-info-text">
            <span className="profil-info-label">{label}</span>
            <div className="profil-info-value">{children}</div>
        </div>
        </div>
    )
}

function Profil() {
    const { user } = useAuth()

    if (!user) {
        return <p className="text-muted">Chargement du profil...</p>
    }

    const initials = user.name
        ? user.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : '?'

    const roleBadgeClass = ROLE_BADGE_CLASS[user.role?.name] || ''

    return (
        <div className="profil-page">
        <div className="profil-header">
            <div className="profil-header-icon">
            <FontAwesomeIcon icon={faIdBadge} />
            </div>
            <h3>Mon profil</h3>
        </div>

        <div className="card-clean profil-card">
            {/* ── Panneau gauche : avatar + identité ── */}
            <div className="profil-side-panel">
            <div className="profil-avatar">
                {initials}
            </div>

            <h4 className="profil-name">{user.name}</h4>
            <p className="profil-email-mini">{user.email}</p>

            {user.role && (
                <span className={`us-badge profil-role-badge ${roleBadgeClass}`}>
                {user.role.name}
                </span>
            )}

            <div className="profil-status-wrap">
                <span
                className={
                    user.statut === 'actif'
                    ? 'badge-status-actif'
                    : 'badge-status-inactif'
                }
                >
                {user.statut === 'actif' ? 'Compte actif' : 'Compte inactif'}
                </span>
            </div>
            </div>

            {/* ── Panneau droit : détails ── */}
            <div className="profil-detail-panel">
            <h6 className="profil-detail-title">Informations du compte</h6>

            <InfoRow icon={faCircleUser} label="Nom complet">
                {user.name}
            </InfoRow>

            <InfoRow icon={faEnvelope} label="Adresse email">
                {user.email}
            </InfoRow>

            <InfoRow icon={faUserShield} label="Rôle">
                {user.role ? (
                <span className={`us-badge ${roleBadgeClass}`}>
                    {user.role.name}
                </span>
                ) : (
                <span className="text-muted">Aucun rôle assigné</span>
                )}
            </InfoRow>

            <InfoRow icon={faSitemap} label="Département">
                {user.departement ? (
                user.departement.nom
                ) : (
                <span className="text-muted">Aucun département assigné</span>
                )}
            </InfoRow>

            <InfoRow icon={faToggleOn} label="Statut du compte">
                <span
                className={
                    user.statut === 'actif'
                    ? 'badge-status-actif'
                    : 'badge-status-inactif'
                }
                >
                {user.statut}
                </span>
            </InfoRow>
            </div>
        </div>
        </div>
    )
}

export default Profil