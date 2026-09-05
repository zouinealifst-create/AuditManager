import { useAuth } from '../context/AuthContext'

export function usePermission(key) {
  const { user } = useAuth()
  if (!user) return false
  
  // Bypass automatique pour l'administrateur
  if (user.role?.name === 'Admin') return true
  
  return user.permissions?.includes(key) ?? false
}
