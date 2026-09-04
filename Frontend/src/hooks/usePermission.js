import { useAuth } from '../context/AuthContext'

export function usePermission(key) {
  const { user } = useAuth()
  if (!user) return false
  return user.permissions?.includes(key) ?? false
}
