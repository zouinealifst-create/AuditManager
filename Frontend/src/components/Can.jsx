import { usePermission } from '../hooks/usePermission'

export default function Can({ perform, children }) {
  const allowed = usePermission(perform)
  return allowed ? children : null
}
