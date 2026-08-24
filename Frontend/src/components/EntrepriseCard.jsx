import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faPen,
  faLocationDot,
  faPhone,
  faEnvelope,
  faGlobe,
  faIndustry,
  faIdCard,
  faFileContract,
  faSitemap,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons'
import './EntrepriseCard.css'

function InfoRow({ icon, label, value }) {
  const display = value === null || value === undefined || value === '' ? 'Non renseigné' : value
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

function EntrepriseCard({ entreprise, onEdit }) {
  return (
    <div className="entreprise-profile-layout">
      {/* ── Panneau gauche ── */}
      <div className="card-clean profile-side-panel">
        <div className="profile-logo">
          {entreprise.logo_url ? (
            <img src={entreprise.logo_url} alt="Logo entreprise" />
          ) : (
            <FontAwesomeIcon icon={faBuilding} />
          )}
        </div>

        <h4 className="profile-name">{entreprise.nom}</h4>

        <span
          className={
            entreprise.statut === 'actif' ? 'badge-status-actif' : 'badge-status-inactif'
          }
        >
          {entreprise.statut}
        </span>

        {entreprise.secteur_activite && (
          <p className="profile-sector">
            <FontAwesomeIcon icon={faIndustry} className="me-2" />
            {entreprise.secteur_activite}
          </p>
        )}

        <div className="profile-side-stat">
          <FontAwesomeIcon icon={faSitemap} />
          <div>
            <div className="stat-value">{entreprise.nombre_departements ?? 0}</div>
            <div className="stat-label">Départements</div>
          </div>
        </div>

        <div className="profile-side-stat">
          <FontAwesomeIcon icon={faCalendar} />
          <div>
            <div className="stat-value">
              {entreprise.created_at
                ? new Date(entreprise.created_at).toLocaleDateString('fr-FR')
                : '-'}
            </div>
            <div className="stat-label">Créée le</div>
          </div>
        </div>

        <button className="btn-teal w-100 mt-3" onClick={onEdit}>
          <FontAwesomeIcon icon={faPen} className="me-2" />
          Modifier le profil
        </button>
      </div>

      {/* ── Panneau droit ── */}
      <div className="card-clean profile-detail-panel">
        {entreprise.description && (
          <div className="detail-block">
            <h6 className="detail-block-title">À propos</h6>
            <p className="profile-about-text">{entreprise.description}</p>
          </div>
        )}

        <div className="detail-block">
          <h6 className="detail-block-title">Coordonnées</h6>
          <div className="info-row-grid">
            <InfoRow icon={faLocationDot} label="Adresse" value={entreprise.adresse} />
            <InfoRow icon={faPhone} label="Téléphone" value={entreprise.telephone} />
            <InfoRow icon={faEnvelope} label="Email" value={entreprise.email} />
            <InfoRow icon={faGlobe} label="Site web" value={entreprise.site_web} />
          </div>
        </div>

        <div className="detail-block">
          <h6 className="detail-block-title">Informations légales</h6>
          <div className="info-row-grid">
            <InfoRow icon={faIdCard} label="ICE" value={entreprise.ice} />
            <InfoRow
              icon={faFileContract}
              label="Registre de Commerce"
              value={entreprise.registre_commerce}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EntrepriseCard