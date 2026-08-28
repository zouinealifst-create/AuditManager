import React from 'react'
import { Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const KpiCard = ({ title, value, subtitle, icon, color = 'primary', loading = false }) => {
  return (
    <Card className="h-100 shadow-sm border-0 rounded-4">
      <Card.Body className="d-flex align-items-center">
        <div 
          className={`bg-${color} bg-opacity-10 text-${color} rounded-circle d-flex align-items-center justify-content-center me-3`}
          style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
        >
          {icon && <FontAwesomeIcon icon={icon} />}
        </div>
        <div>
          <h6 className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
            {title}
          </h6>
          {loading ? (
            <div className="spinner-border spinner-border-sm text-secondary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          ) : (
            <h2 className="mb-0 fw-bold">{value !== undefined && value !== null ? value : '-'}</h2>
          )}
          {subtitle && (
            <small className="text-muted d-block mt-1">
              {subtitle}
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}

export default KpiCard
