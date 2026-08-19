/**
 * API Questions
 *
 * Endpoints (protégés par auth:sanctum) :
 *   POST   /api/checklists/{checklistId}/questions
 *   PUT    /api/checklists/{checklistId}/questions/{questionId}
 *   DELETE /api/checklists/{checklistId}/questions/{questionId}
 */
import client from './client'

/**
 * Ajoute une question à une checklist.
 *
 * @param {number} checklistId  - ID de la checklist parente
 * @param {{ texte: string, ordre?: number }} data
 * @returns {Promise<Object>}   la question créée { id, texte, ordre, checklist_id }
 */
export async function addQuestion(checklistId, data) {
  const response = await client.post(`/checklists/${checklistId}/questions`, {
    texte: data.texte,
    ordre: data.ordre,
  })
  // L'API retourne { success: true, message: '...', data: { id, texte, ordre, ... } }
  return response.data.data
}

/**
 * Met à jour le texte d'une question existante.
 * Utilise la route shallow : PUT /api/questions/{questionId}
 *
 * @param {number} questionId   - ID de la question à modifier
 * @param {{ texte: string }} data
 * @returns {Promise<Object>}   la question mise à jour
 */
export async function updateQuestion(checklistId, questionId, data) {
  // checklistId conservé en paramètre pour compatibilité, mais non utilisé
  // (route shallow : PUT /api/questions/{id})
  const response = await client.put(`/questions/${questionId}`, { texte: data.texte })
  return response.data.data
}

/**
 * Supprime une question.
 * Utilise la route shallow : DELETE /api/questions/{questionId}
 *
 * @param {number} questionId   - ID de la question à supprimer
 * @returns {Promise<void>}
 */
export async function deleteQuestion(checklistId, questionId) {
  // checklistId conservé en paramètre pour compatibilité, mais non utilisé
  // (route shallow : DELETE /api/questions/{id})
  await client.delete(`/questions/${questionId}`)
}
