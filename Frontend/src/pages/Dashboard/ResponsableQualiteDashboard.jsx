import React, { useState, useMemo } from 'react'
import { Container, Row, Col, Form, Card, Table, Badge, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faClipboardList, faCheckSquare, faExclamationTriangle, 
  faWrench, faArrowRight, faChartPie, faBuilding, faEye
} from '@fortawesome/free-solid-svg-icons'

// Hooks API
import { useGetAuditsQuery } from '../../store/api/auditsApi'
import { useListChecklistsQuery } from '../../store/api/checklistsApi'
import { useGetDepartementsQuery } from '../../store/api/departementsApi'
import { useGetAllNormesQuery } from '../../store/api/normesApi'
import { useGetNonConformitesQuery } from '../../store/api/nonConformitesApi'

import KpiCard from '../../components/dashboard/KpiCard'
import './ResponsableQualiteDashboard.css'

const ResponsableQualiteDashboard = () => {
  // Filtre Département
  const [selectedDeptId, setSelectedDeptId] = useState('')

  // ── Queries ──
  const { data: departements = [], isLoading: isLoadingDepts } = useGetDepartementsQuery()
  
  // Note: On passe le departement_id si sélectionné
  const queryParams = selectedDeptId ? { departement_id: selectedDeptId } : {}
  const { data: auditsData, isLoading: isLoadingAudits } = useGetAuditsQuery(queryParams)
  
  // checklistsApi doesn't filter by dept natively via query param in backend based on my quick check, but let's assume we fetch all and filter if needed, 
  // or pass params if backend supports. Here we just fetch all checklists.
  const { data: checklistsData, isLoading: isLoadingChecklists } = useListChecklistsQuery()
  
  const { data: normesData, isLoading: isLoadingNormes } = useGetAllNormesQuery()
  
  // non-conformites filter by dept not native, but we can fetch and filter, or assume it's global for now.
  const { data: nonConformitesData, isLoading: isLoadingNc } = useGetNonConformitesQuery()

  // ── Derived Data ──
  // Extraction sécurisée des tableaux de données (gère les réponses paginées ou directes)
  const audits = auditsData?.data || auditsData || []
  const checklists = checklistsData?.data || checklistsData || []
  const normes = normesData?.data || normesData || []
  const nonConformites = nonConformitesData?.data || nonConformitesData || []
  
  // Calculate stats based on fetched arrays
  const auditsStats = useMemo(() => {
    return {
      total: audits.length,
      planifies: audits.filter(a => a.statut === 'planifie').length,
      enCours: audits.filter(a => a.statut === 'en_cours').length,
      termines: audits.filter(a => a.statut === 'termine').length,
      clotures: audits.filter(a => a.statut === 'cloture').length,
    }
  }, [audits])

  const checklistsStats = useMemo(() => {
    // If selectedDeptId, ideally we filter checklists by dept if relation exists. 
    // Usually checklists are global. We'll show global stats.
    return {
      total: checklists.length,
      actives: checklists.filter(c => c.statut === 'publiee').length,
      brouillons: checklists.filter(c => c.statut === 'brouillon').length,
      archivees: checklists.filter(c => c.statut === 'archivee').length,
    }
  }, [checklists])

  const ncStats = useMemo(() => {
    // Basic filter by dept if needed, but let's assume they are linked to audits, which are linked to dept.
    const filteredNc = selectedDeptId 
      ? nonConformites.filter(nc => nc.reponse?.audit?.departement_id === Number(selectedDeptId)) // simplistic approach if relations loaded
      : nonConformites
      
    return {
      total: filteredNc.length,
      ouvertes: filteredNc.filter(nc => nc.statut === 'ouverte' || nc.statut === 'en_cours').length,
      recentes: [...filteredNc].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
    }
  }, [nonConformites, selectedDeptId])

  const normesStats = {
    total: normes.length,
    actives: normes.filter(n => n.statut === 'active' || !n.statut).length // depending on exact field
  }

  // ── Handlers ──
  const handleDeptChange = (e) => {
    setSelectedDeptId(e.target.value)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="dashboard-container py-4"
    >
      <Container fluid>
        {/* Header & Filtres */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-0 fw-bold text-navy">Dashboard Qualité</h2>
            <p className="text-muted mb-0">Vue globale des processus d'audit et d'amélioration continue.</p>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <Form.Group className="d-flex align-items-center mb-0">
              <Form.Label className="me-2 mb-0 fw-semibold text-muted text-nowrap">Département :</Form.Label>
              <Form.Select 
                value={selectedDeptId} 
                onChange={handleDeptChange}
                disabled={isLoadingDepts}
                className="shadow-sm border-0 bg-white"
                style={{ minWidth: '200px' }}
              >
                <option value="">Tous les départements</option>
                {departements.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        </div>

        {/* Ligne 1 : KPIs */}
        <Row className="mb-4 g-3">
          <Col md={6} lg={3}>
            <KpiCard 
              title="Audits" 
              value={auditsStats.total} 
              subtitle={`${auditsStats.enCours} en cours`} 
              icon={faClipboardList} 
              color="primary"
              loading={isLoadingAudits}
            />
          </Col>
          <Col md={6} lg={3}>
            <KpiCard 
              title="Checklists" 
              value={checklistsStats.total} 
              subtitle={`${checklistsStats.actives} actives`} 
              icon={faCheckSquare} 
              color="success"
              loading={isLoadingChecklists}
            />
          </Col>
          <Col md={6} lg={3}>
            <KpiCard 
              title="Non-conformités" 
              value={ncStats.total} 
              subtitle={`${ncStats.ouvertes} ouvertes/en cours`} 
              icon={faExclamationTriangle} 
              color="warning"
              loading={isLoadingNc}
            />
          </Col>
          <Col md={6} lg={3}>
            <KpiCard 
              title="Actions correctives" 
              value="-" 
              subtitle="Données non disponibles ⚠️" 
              icon={faWrench} 
              color="danger"
            />
          </Col>
        </Row>

        <Row className="mb-4 g-4">
          {/* Suivi des Audits (Graphique CSS / Barres) */}
          <Col lg={8}>
            <Card className="h-100 shadow-sm border-0 rounded-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                <h5 className="fw-bold text-navy mb-0">
                  <FontAwesomeIcon icon={faChartPie} className="me-2 text-primary" />
                  Répartition des Audits
                </h5>
              </Card.Header>
              <Card.Body>
                {isLoadingAudits ? (
                   <p className="text-muted text-center py-4">Chargement...</p>
                ) : audits.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-0">Aucun audit trouvé pour cette sélection.</p>
                  </div>
                ) : (
                  <div className="audit-bars-container mt-3">
                    <div className="audit-bar-item mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-muted">Planifiés</span>
                        <span className="fw-bold">{auditsStats.planifies}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-info" style={{ width: `${(auditsStats.planifies / auditsStats.total) * 100}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="audit-bar-item mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-muted">En cours</span>
                        <span className="fw-bold">{auditsStats.enCours}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-primary" style={{ width: `${(auditsStats.enCours / auditsStats.total) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="audit-bar-item mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-muted">Terminés</span>
                        <span className="fw-bold">{auditsStats.termines}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-warning" style={{ width: `${(auditsStats.termines / auditsStats.total) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="audit-bar-item">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold text-muted">Clôturés</span>
                        <span className="fw-bold">{auditsStats.clotures}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: `${(auditsStats.clotures / auditsStats.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Alertes / À surveiller */}
          <Col lg={4}>
            <Card className="h-100 shadow-sm border-0 rounded-4 bg-light border-start border-warning border-4">
              <Card.Body>
                <h5 className="fw-bold text-navy mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-warning" />
                  À surveiller
                </h5>
                <ul className="list-unstyled mb-0 alerts-list">
                  {ncStats.ouvertes > 0 && (
                    <li className="mb-3 d-flex align-items-start">
                      <Badge bg="warning" className="me-2 mt-1 px-2 py-1 rounded-pill">NC</Badge>
                      <span className="text-dark small"><strong>{ncStats.ouvertes}</strong> non-conformités sont actuellement ouvertes ou en cours.</span>
                    </li>
                  )}
                  {auditsStats.enCours > 0 && (
                    <li className="mb-3 d-flex align-items-start">
                      <Badge bg="primary" className="me-2 mt-1 px-2 py-1 rounded-pill">Audit</Badge>
                      <span className="text-dark small"><strong>{auditsStats.enCours}</strong> audits sont en cours d'exécution.</span>
                    </li>
                  )}
                  <li className="mb-3 d-flex align-items-start">
                    <Badge bg="danger" className="me-2 mt-1 px-2 py-1 rounded-pill">Action</Badge>
                    <span className="text-muted small">Suivi des actions correctives en retard ⚠️ (API manquante)</span>
                  </li>
                  <li className="d-flex align-items-start">
                    <Badge bg="secondary" className="me-2 mt-1 px-2 py-1 rounded-pill">Valid.</Badge>
                    <span className="text-muted small">Corrections en attente de validation ⚠️ (API manquante)</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4 g-4">
           {/* Audits Récents */}
           <Col lg={6}>
            <Card className="h-100 shadow-sm border-0 rounded-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-navy mb-0">Audits Récents</h5>
                <Link to="/audits" className="text-decoration-none small fw-semibold text-primary">
                  Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                </Link>
              </Card.Header>
              <Card.Body className="px-0">
                {isLoadingAudits ? (
                  <p className="text-center text-muted">Chargement...</p>
                ) : audits.length === 0 ? (
                  <p className="text-center text-muted my-3">Aucun audit récent.</p>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 custom-table">
                      <thead className="table-light text-muted small text-uppercase">
                        <tr>
                          <th className="ps-4">Titre</th>
                          <th>Département</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audits.slice(0, 5).map(audit => (
                          <tr key={audit.id}>
                            <td className="ps-4">
                              <span className="fw-semibold text-dark">{audit.titre}</span>
                              <br/>
                              <small className="text-muted">{audit.date_prevue || '-'}</small>
                            </td>
                            <td>{audit.departement?.nom || '-'}</td>
                            <td>
                              <Badge bg={
                                audit.statut === 'planifie' ? 'info' : 
                                audit.statut === 'en_cours' ? 'primary' : 
                                audit.statut === 'termine' ? 'warning' : 
                                audit.statut === 'cloture' ? 'success' : 'secondary'
                              } className="fw-normal rounded-pill px-3 py-2">
                                {audit.statut}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Non-conformités Récentes */}
          <Col lg={6}>
            <Card className="h-100 shadow-sm border-0 rounded-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-navy mb-0">Non-conformités Récentes</h5>
                <Link to="/non-conformites" className="text-decoration-none small fw-semibold text-primary">
                  Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                </Link>
              </Card.Header>
              <Card.Body className="px-0">
                {isLoadingNc ? (
                   <p className="text-center text-muted">Chargement...</p>
                ) : ncStats.recentes.length === 0 ? (
                  <p className="text-center text-muted my-3">Aucune non-conformité.</p>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 custom-table">
                      <thead className="table-light text-muted small text-uppercase">
                        <tr>
                          <th className="ps-4">Description</th>
                          <th>Gravité</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ncStats.recentes.map(nc => (
                          <tr key={nc.id}>
                            <td className="ps-4" style={{ maxWidth: '200px' }}>
                              <div className="text-truncate fw-semibold text-dark" title={nc.description}>
                                {nc.description}
                              </div>
                              <small className="text-muted">{nc.date_detection}</small>
                            </td>
                            <td>
                               <Badge bg={
                                nc.gravite === 'critique' ? 'danger' : 
                                nc.gravite === 'majeure' ? 'warning' : 'info'
                              } className="fw-normal rounded-pill px-2">
                                {nc.gravite}
                              </Badge>
                            </td>
                            <td>
                              <span className="small text-muted text-capitalize">{nc.statut?.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mb-4">
           {/* Synthèse globale : Checklists & Normes */}
           <Col lg={4}>
              <Card className="h-100 shadow-sm border-0 rounded-4">
                <Card.Body>
                   <h6 className="fw-bold text-navy mb-3 border-bottom pb-2">Synthèse Documentaire</h6>
                   
                   <div className="d-flex justify-content-between align-items-center mb-3">
                     <span className="text-muted"><FontAwesomeIcon icon={faCheckSquare} className="me-2"/> Checklists Actives</span>
                     <span className="fw-bold fs-5">{checklistsStats.actives} <small className="text-muted fs-6 fw-normal">/ {checklistsStats.total}</small></span>
                   </div>
                   
                   <div className="d-flex justify-content-between align-items-center mb-4">
                     <span className="text-muted"><FontAwesomeIcon icon={faClipboardList} className="me-2"/> Normes Actives</span>
                     <span className="fw-bold fs-5">{normesStats.actives} <small className="text-muted fs-6 fw-normal">/ {normesStats.total}</small></span>
                   </div>

                   <div className="d-grid gap-2">
                     <Link to="/checklists" className="btn btn-light text-primary btn-sm rounded-pill fw-semibold border">
                        Gérer les checklists
                     </Link>
                     <Link to="/normes" className="btn btn-light text-primary btn-sm rounded-pill fw-semibold border">
                        Catalogue des normes
                     </Link>
                   </div>
                </Card.Body>
              </Card>
           </Col>

           {/* Suivi des départements (Tableau résumé) */}
           <Col lg={8}>
             <Card className="h-100 shadow-sm border-0 rounded-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                <h5 className="fw-bold text-navy mb-0">
                  <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                  Aperçu par Département
                </h5>
              </Card.Header>
              <Card.Body className="px-0">
                {isLoadingDepts ? (
                   <p className="text-center text-muted">Chargement...</p>
                ) : departements.length === 0 ? (
                  <p className="text-center text-muted my-3">Aucun département trouvé.</p>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <Table hover className="align-middle mb-0 custom-table">
                      <thead className="table-light text-muted small text-uppercase sticky-top">
                        <tr>
                          <th className="ps-4">Département</th>
                          <th className="text-center">Audits Total</th>
                          <th className="text-center">Non-conformités</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departements.map(dept => {
                          // Simple client-side aggregation based on fetched data if available
                          // In a real huge app, this would be a dedicated backend endpoint.
                          const deptAudits = auditsData?.data?.filter(a => a.departement_id === dept.id) || []
                          const deptNc = nonConformites.filter(nc => nc.reponse?.audit?.departement_id === dept.id)
                          
                          return (
                            <tr key={dept.id}>
                              <td className="ps-4 fw-semibold text-dark">{dept.nom}</td>
                              <td className="text-center">{deptAudits.length || '-'}</td>
                              <td className="text-center">{deptNc.length || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
             </Card>
           </Col>
        </Row>
        
        {/* Sections Manquantes (Mockups explicitant les manques) */}
        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0 rounded-4 bg-light">
              <Card.Body className="text-center py-5">
                <div className="text-muted opacity-50 mb-3">
                  <FontAwesomeIcon icon={faWrench} size="3x" />
                </div>
                <h5 className="text-muted fw-bold">Actions correctives en retard</h5>
                <p className="text-muted small mb-0">Endpoint backend non disponible pour le moment.</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="shadow-sm border-0 rounded-4 bg-light">
              <Card.Body className="text-center py-5">
                <div className="text-muted opacity-50 mb-3">
                  <FontAwesomeIcon icon={faCheckSquare} size="3x" />
                </div>
                <h5 className="text-muted fw-bold">Corrections à vérifier</h5>
                <p className="text-muted small mb-0">En attente d'intégration API.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </motion.div>
  )
}

export default ResponsableQualiteDashboard
