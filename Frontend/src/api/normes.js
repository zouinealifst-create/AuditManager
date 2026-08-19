/**
 * API Normes
 *
 * Endpoint : GET /api/normes?secteur_id={id}
 *
 * Le backend retourne :
 *   - les normes actives du secteur (via pivot norme_secteur)
 *   - les normes actives universelles (est_universelle = true)
 *   - sans doublons
 *
 * IMPORTANT : cette fonction ne modifie JAMAIS normes.statut.
 * Le filtrage est purement en lecture.
 */
import client from './client'

/**
 * Récupère les normes applicables à un secteur donné.
 * Inclut automatiquement les normes universelles.
 *
 * @param {number} secteurId  - ID du secteur du département sélectionné
 * @returns {Promise<Array>}  - tableau de normes { id, code, nom, description, statut, est_universelle }
 */
export async function getNormesParSecteur(secteurId) {
  const response = await client.get('/normes', {
    params: { secteur_id: secteurId },
  })
  // L'API retourne { success: true, data: [...] }
  return response.data.data
}

/**
 * Récupère toutes les normes du catalogue (sans filtre secteur).
 * Usage réservé à l'administration.
 */
export async function getAllNormes() {
  const response = await client.get('/normes')
  return response.data.data
}
