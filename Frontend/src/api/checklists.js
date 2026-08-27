/**
 * API Checklists — liste, mise à jour, suppression
 */
import client from './client'

/**
 * Récupère la liste paginée des checklists.
 * @param {{ statut?: string, norme_id?: number, page?: number }} params
 */
export async function listChecklists({ statut, norme_id, page = 1 } = {}) {
  const params = { page }
  if (statut)   params.statut   = statut
  if (norme_id) params.norme_id = norme_id
  const response = await client.get('/checklists', { params })
  // { success, data: { data: [], current_page, last_page, total, ... } }
  return response.data.data
}

/**
 * Met à jour une checklist.
 * @param {number} id
 * @param {{ norme_id?, titre?, description?, statut? }} data
 */
export async function updateChecklist(id, data) {
  const response = await client.put(`/checklists/${id}`, data)
  return response.data.data
}

/**
 * Supprime une checklist.
 * @param {number} id
 */
export async function deleteChecklist(id) {
  await client.delete(`/checklists/${id}`)
}

/**
 * Récupère une checklist par son ID.
 * @param {number} id
 */
export async function getChecklist(id) {
  const response = await client.get(`/checklists/${id}`)
  return response.data.data
}

/**
 * Crée une nouvelle checklist en brouillon.
 * @param {{ norme_id: number, titre: string, description?: string, statut?: string }} data
 */
export async function createChecklist(data) {
  const response = await client.post('/checklists', {
    norme_id:    data.norme_id,
    titre:       data.titre,
    description: data.description || null,
    statut:      data.statut || 'brouillon',
  })
  return response.data.data
}

/**
 * Publie une checklist (statut → 'actif').
 * @param {number} id
 */
export async function publierChecklist(id) {
  const response = await client.put(`/checklists/${id}`, { statut: 'actif' })
  return response.data.data
}

/**
 * Récupère toutes les checklists actives (pour la création d'un audit).
 * Filtre optionnellement par département_id.
 * @param {number} departement_id
 * @returns {Promise<Array>}
 */
export async function listChecklistsActives(departement_id = null) {
  const params = { statut: 'actif', page: 1 }
  if (departement_id) params.departement_id = departement_id
  const response = await client.get('/checklists', { params })
  return response.data.data?.data ?? []
}
