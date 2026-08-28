import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSitemap, faUsers, faClipboardList, faClipboardCheck,
    faTriangleExclamation, faCircleCheck, faClock, faArrowRight,
    faBuilding, faFileCircleExclamation, faBolt,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import { useGetDepartementsQuery } from '../../store/api/departementsApi'
import { useGetUsersQuery } from '../../store/api/usersApi'
import { useListChecklistsQuery } from '../../store/api/checklistsApi'
import { useGetAuditsQuery } from '../../store/api/auditsApi'
import { useGetEntrepriseQuery } from '../../store/api/entreprisesApi'
import './Dashboard.css'

function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(iso) {
    if (!iso) return ''
    const diffMs = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diffMs / 86400000)
    if (days <= 0) return "aujourd'hui"
    if (days === 1) return 'hier'
    if (days < 30) return `il y a ${days} j`
    return formatDate(iso)
}

/** Anneau de progression SVG simple, sans dépendance externe */
function ProgressRing({ percent, color, size = 88, stroke = 9, label, sub }) {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c
    return (
        <div className="db2-ring-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f4" strokeWidth={stroke} />
            <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text x="50%" y="52%" textAnchor="middle" fontSize="1.1rem" fontWeight="700" fill="#0f172a">
            {Math.round(percent)}%
            </text>
        </svg>
        <div className="db2-ring-label">{label}</div>
        {sub && <div className="db2-ring-sub">{sub}</div>}
        </div>
    )
}

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const { data: departements = [] } = useGetDepartementsQuery({ per_page: 100 })
    const { data: users = [] } = useGetUsersQuery({ per_page: 100 })
    const { data: entreprise } = useGetEntrepriseQuery()

    const { data: checklistsAll } = useListChecklistsQuery({ page: 1 })
    const { data: checklistsActives } = useListChecklistsQuery({ statut: 'actif', page: 1 })
    const { data: checklistsBrouillon } = useListChecklistsQuery({ statut: 'brouillon', page: 1 })

    const { data: auditsAll, isLoading: loadingAudits } = useGetAuditsQuery({ page: 1 })
    const { data: auditsCloture } = useGetAuditsQuery({ statut: 'cloture', page: 1 })
    const { data: auditsEnCours } = useGetAuditsQuery({ statut: 'en_cours', page: 1 })
    const { data: auditsPlanifie } = useGetAuditsQuery({ statut: 'planifie', page: 1 })

    const totalAudits = auditsAll?.total ?? 0
    const totalChecklists = checklistsAll?.total ?? 0
    const clotureCount = auditsCloture?.total ?? 0

    const conformitePct = totalChecklists > 0
        ? ((checklistsActives?.total ?? 0) / totalChecklists) * 100
        : 0
    const avancementPct = totalAudits > 0 ? (clotureCount / totalAudits) * 100 : 0

    // ── Départements sans secteur (config incomplète) ──
    const deptsSansSecteur = departements.filter(d => !d.secteur)

    // ── Audits en retard : date_prevue passée, pas encore clôturé ──
    const now = Date.now()
    const auditsEnRetard = (auditsAll?.data ?? []).filter(a =>
        a.date_prevue &&
        new Date(a.date_prevue).getTime() < now &&
        !['termine', 'cloture'].includes(a.statut)
    )

    // ── Panneau d'alertes ──
    const alerts = useMemo(() => {
        const list = []
        if (deptsSansSecteur.length > 0) {
        list.push({
            icon: faSitemap,
            color: 'db2-alert-amber',
            text: `${deptsSansSecteur.length} département(s) sans secteur assigné`,
            detail: deptsSansSecteur.map(d => d.nom).join(', '),
            to: '/departements',
        })
        }
        if (auditsEnRetard.length > 0) {
        list.push({
            icon: faClock,
            color: 'db2-alert-red',
            text: `${auditsEnRetard.length} audit(s) en retard`,
            detail: auditsEnRetard.map(a => a.titre).slice(0, 3).join(', '),
            to: '/audits',
        })
        }
        if ((checklistsBrouillon?.total ?? 0) > 0) {
        list.push({
            icon: faFileCircleExclamation,
            color: 'db2-alert-blue',
            text: `${checklistsBrouillon.total} checklist(s) en brouillon`,
            detail: 'Non publiées, donc invisibles lors de la création d\'un audit',
            to: '/checklists',
        })
        }
        return list
    }, [deptsSansSecteur, auditsEnRetard, checklistsBrouillon])

  // ── Timeline d'activité (audits récents) ──
    const timeline = (auditsAll?.data ?? [])
        .slice()
        .sort((a, b) => new Date(b.created_at || b.date_prevue || 0) - new Date(a.created_at || a.date_prevue || 0))
        .slice(0, 6)

  // ── Santé des départements ──
    const deptHealth = departements.map(d => ({
        ...d,
        auditCount: (auditsAll?.data ?? []).filter(a => a.departement?.id === d.id).length,
    })).sort((a, b) => b.auditCount - a.auditCount).slice(0, 6)

    return (
        <div className="db2-page">
        {/* ── Hero ── */}
        <div className="db2-hero">
            <div className="db2-hero-text">
            <span className="db2-hero-eyebrow">Vue d'ensemble</span>
            <h1 className="db2-hero-title">
                {entreprise?.nom || 'Votre entreprise'}
            </h1>
            <p className="db2-hero-sub">
                Connecté en tant que <strong>{user?.name}</strong> · {formatDate(new Date().toISOString())}
            </p>
            </div>
            <div className="db2-hero-stats">
            <div className="db2-hero-stat">
                <div className="db2-hero-stat-value">{departements.length}</div>
                <div className="db2-hero-stat-label">Départements</div>
            </div>
            <div className="db2-hero-stat">
                <div className="db2-hero-stat-value">{users.length}</div>
                <div className="db2-hero-stat-label">Utilisateurs</div>
            </div>
            <div className="db2-hero-stat">
                <div className="db2-hero-stat-value">{totalAudits}</div>
                <div className="db2-hero-stat-label">Audits</div>
            </div>
            <div className="db2-hero-stat">
                <div className="db2-hero-stat-value">{totalChecklists}</div>
                <div className="db2-hero-stat-label">Checklists</div>
            </div>
            </div>
        </div>

        <div className="db2-grid-main">
            {/* ── Colonne gauche : anneaux + départements ── */}
            <div className="db2-col">
            <div className="db2-card">
                <div className="db2-card-header">
                <FontAwesomeIcon icon={faBolt} />
                <h2>Santé globale</h2>
                </div>
                <div className="db2-rings-row">
                <ProgressRing
                    percent={conformitePct}
                    color="#3a8a90"
                    label="Checklists actives"
                    sub={`${checklistsActives?.total ?? 0} / ${totalChecklists}`}
                />
                <ProgressRing
                    percent={avancementPct}
                    color="#7c3aed"
                    label="Audits clôturés"
                    sub={`${clotureCount} / ${totalAudits}`}
                />
                <ProgressRing
                    percent={totalAudits > 0 ? ((auditsEnCours?.total ?? 0) / totalAudits) * 100 : 0}
                    color="#f59e0b"
                    label="Audits en cours"
                    sub={`${auditsEnCours?.total ?? 0} actif(s)`}
                />
                </div>
            </div>

            <div className="db2-card">
                <div className="db2-card-header">
                <FontAwesomeIcon icon={faBuilding} />
                <h2>Départements les plus audités</h2>
                <Link to="/departements" className="db2-card-link">
                    Voir tout <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                </div>
                <div className="db2-dept-list">
                {deptHealth.length === 0 ? (
                    <div className="db2-empty">Aucun département.</div>
                ) : deptHealth.map(d => (
                    <div key={d.id} className="db2-dept-row">
                    <div className="db2-dept-name">
                        {d.nom}
                        {!d.secteur && (
                        <span className="db2-dept-warn" title="Sans secteur assigné">
                            <FontAwesomeIcon icon={faTriangleExclamation} />
                        </span>
                        )}
                    </div>
                    <div className="db2-dept-bar-track">
                        <div
                        className="db2-dept-bar-fill"
                        style={{ width: `${Math.min(100, (d.auditCount / Math.max(1, deptHealth[0]?.auditCount || 1)) * 100)}%` }}
                        />
                    </div>
                    <div className="db2-dept-count">{d.auditCount}</div>
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* ── Colonne droite : alertes + timeline ── */}
            <div className="db2-col">
            <div className="db2-card">
                <div className="db2-card-header">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <h2>Points d'attention</h2>
                </div>
                <div className="db2-alerts-list">
                {alerts.length === 0 ? (
                    <div className="db2-all-good">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Tout est en ordre, aucune alerte à signaler.
                    </div>
                ) : alerts.map((a, i) => (
                    <div
                    key={i}
                    className={`db2-alert-item ${a.color}`}
                    onClick={() => navigate(a.to)}
                    >
                    <FontAwesomeIcon icon={a.icon} className="db2-alert-icon" />
                    <div>
                        <div className="db2-alert-text">{a.text}</div>
                        <div className="db2-alert-detail">{a.detail}</div>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            <div className="db2-card">
                <div className="db2-card-header">
                <FontAwesomeIcon icon={faClipboardCheck} />
                <h2>Activité récente</h2>
                <Link to="/audits" className="db2-card-link">
                    Tout voir <FontAwesomeIcon icon={faArrowRight} />
                </Link>
                </div>
                <div className="db2-timeline">
                {loadingAudits ? (
                    <div className="db2-empty">Chargement…</div>
                ) : timeline.length === 0 ? (
                    <div className="db2-empty">Aucune activité récente.</div>
                ) : timeline.map(a => (
                    <div key={a.id} className="db2-timeline-item">
                    <span className={`db2-timeline-dot db2-td-${a.statut}`} />
                    <div className="db2-timeline-body">
                        <div className="db2-timeline-title">{a.titre}</div>
                        <div className="db2-timeline-meta">
                        {a.departement?.nom ?? 'Sans département'} · {timeAgo(a.created_at || a.date_prevue)}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </div>
        </div>
    )
}