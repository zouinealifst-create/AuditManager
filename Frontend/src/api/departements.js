/**
 * API Départements
 *
 * Endpoint : GET /api/departements
 * Réponse paginée par Laravel Resource Collection.
 * Chaque département expose : id, nom, description, secteur_id, secteur { id, nom }
 */
import client from './client'

/**
 * Récupère la liste de tous les départements (toutes les pages).
 * Retourne un tableau de départements.
 */
export async function getDepartements() {
  // Laravel pagine à 10 par défaut ; on charge la page 1
  // et on récupère `data` de la réponse paginée.
  const response = await client.get('/departements')
  // Laravel Resource Collection retourne { data: [...], links: {...}, meta: {...} }
  return response.data.data
}
