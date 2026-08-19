/**
 * AuditsWrapper.jsx
 * Gère la navigation interne du module Audit :
 *   'list'   → AuditsListPage
 *   'create' → AuditCreate
 *   'detail' → AuditDetail
 */
import { useState } from 'react'
import AuditsListPage from './AuditsListPage'
import AuditCreate    from './AuditCreate'
import AuditDetail    from './AuditDetail'

export default function AuditsWrapper() {
  const [view,         setView]         = useState('list')  // 'list' | 'create' | 'detail'
  const [selectedAudit,setSelectedAudit]= useState(null)
  const [defaultAction,setDefaultAction]= useState(null)
  const [listKey,      setListKey]      = useState(0) // force refresh de la liste

  const goList   = ()    => { setView('list');   setSelectedAudit(null) }
  const goCreate = ()    => setView('create')
  const goDetail = (a, action) => {
    setSelectedAudit(a)
    setDefaultAction(action ?? null)
    setView('detail')
  }

  const handleCreated = (audit) => {
    setListKey(k => k + 1)
    goDetail(audit)
  }

  return (
    <>
      {view === 'list'   && (
        <AuditsListPage
          key={listKey}
          onNew={goCreate}
          onView={goDetail}
        />
      )}
      {view === 'create' && (
        <AuditCreate
          onCreated={handleCreated}
          onCancel={goList}
        />
      )}
      {view === 'detail' && selectedAudit && (
        <AuditDetail
          auditId={selectedAudit.id}
          onBack={goList}
          onRefresh={() => setListKey(k => k + 1)}
          defaultAction={defaultAction}
        />
      )}
    </>
  )
}
