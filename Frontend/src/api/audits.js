/**
 * API Audits
 *
 * Routes disponibles (auth:sanctum en production) :
 *   GET    /api/audits
 *   POST   /api/audits
 *   GET    /api/audits/{id}
 *   PUT    /api/audits/{id}
 *   DELETE /api/audits/{id}
 *   PATCH  /api/audits/{id}/planifier
 *   PATCH  /api/audits/{id}/affecter-auditeur
 *   PATCH  /api/audits/{id}/affecter-departement
 *   PATCH  /api/audits/{id}/demarrer
 *   PATCH  /api/audits/{id}/cloturer
 *
 * Statuts réels backend : brouillon → planifie → en_cours → termine → cloture
 */
import client from './client'

/**
 * Liste paginée des audits.
 * @param {{ statut?: string, departement_id?: number, page?: number }} params
 */
export async function getAudits({ statut, departement_id, page = 1 } = {}) {
  const params = { page }
  if (statut)          params.statut          = statut
  if (departement_id)  params.departement_id  = departement_id
  const response = await client.get('/audits', { params })
  return response.data.data // { data: [], current_page, last_page, total }
}

/**
 * Détail d'un audit avec toutes ses relations (checklist, questions, norme,
 * département, auditeur, responsable qualité).
 */
export async function getAudit(id) {
  const response = await client.get(`/audits/${id}`)
  return response.data.data
}

/**
 * Crée un nouvel audit (statut initial : brouillon).
 * @param {{ checklist_id: number, titre: string, departement_id?: number, auditeur_id?: number, date_prevue?: string }} data
 */
export async function createAudit(data) {
  const response = await client.post('/audits', data)
  return response.data.data
}

/**
 * Met à jour un audit (seulement si brouillon pour titre/checklist).
 */
export async function updateAudit(id, data) {
  const response = await client.put(`/audits/${id}`, data)
  return response.data.data
}

/**
 * Supprime un audit.
 */
export async function deleteAudit(id) {
  await client.delete(`/audits/${id}`)
}

/**
 * Planifie un audit : brouillon → planifie.
 * Nécessite : date_prevue, departement_id, auditeur_id.
 */
export async function planifierAudit(id, { date_prevue, departement_id, auditeur_id }) {
  const response = await client.patch(`/audits/${id}/planifier`, {
    date_prevue,
    departement_id,
    auditeur_id,
  })
  return response.data.data
}

/**
 * Démarre un audit : planifie → en_cours.
 * Réservé à l'auditeur assigné.
 */
export async function demarrerAudit(id) {
  const response = await client.patch(`/audits/${id}/demarrer`)
  return response.data.data
}

/**
 * Clôture un audit : termine → cloture.
 */
export async function cloturerAudit(id) {
  const response = await client.patch(`/audits/${id}/cloturer`)
  return response.data.data
}
