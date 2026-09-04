import { Link } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'

export default function Forbidden() {
  return (
    <Container className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
      <FontAwesomeIcon icon={faLock} className="text-danger mb-4" style={{ fontSize: '4rem' }} />
      <h1 className="fw-bold mb-3">Accès Refusé</h1>
      <p className="text-muted mb-4">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Button as={Link} to="/dashboard" variant="primary">
        Retour au Dashboard
      </Button>
    </Container>
  )
}
