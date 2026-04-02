'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const COLORS = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f4f3ef',
  textPrimary: '#1a1a18',
  textSecondary: '#5f5e5a',
  textTertiary: '#888780',
  border: 'rgba(0,0,0,0.12)',
  badgeBlue: { bg: '#e6f1fb', text: '#0c447c' },
  badgeAmber: { bg: '#faeeda', text: '#633806' },
  badgeRed: { bg: '#fcebeb', text: '#791f1f' },
}

type BadgeType = 'blue' | 'amber' | 'red'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: { text: string; type: BadgeType }
  matchPaths?: string[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Vue générale',
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
      },
      {
        name: 'Trackers live',
        href: '/admin/trackers',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1L2 5.3l4.2-.7z"/></svg>,
        badge: { text: 'live', type: 'blue' },
      },
    ],
  },
  {
    label: 'Contenu',
    items: [
      {
        name: 'Fiches & flashcards',
        href: '/admin/flashcards',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h10M3 7h10M3 10h6"/></svg>,
      },
      {
        name: 'Génération IA',
        href: '/admin/ia',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>,
        badge: { text: '3', type: 'amber' },
      },
      {
        name: 'Hiérarchie de contenu',
        href: '/admin/subjects',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12V4l6-2 6 2v8l-6 2z"/></svg>,
        matchPaths: ['/admin/subjects', '/admin/courses', '/admin/chapters', '/admin/sections'],
      },
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      {
        name: 'Étudiants',
        href: '/admin/etudiants',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2.2-5 5-5s5 2 5 5"/><circle cx="12" cy="5" r="2"/><path d="M12 9c2 0 3 1.3 3 3"/></svg>,
      },
      {
        name: 'Abonnements & accès',
        href: '/admin/abonnements',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="12" height="8" rx="1"/><path d="M5 6V4a3 3 0 016 0v2"/></svg>,
      },
      {
        name: 'Tutorat & QR codes',
        href: '/admin/tutorat',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L2 4v4c0 3.3 2.7 5.7 6 7 3.3-1.3 6-3.7 6-7V4z"/></svg>,
        badge: { text: 'new', type: 'blue' },
      },
    ],
  },
  {
    label: 'Retours',
    items: [
      {
        name: 'Feedback & signalements',
        href: '/admin/feedback',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12v9H9l-3 3v-3H2z"/></svg>,
        badge: { text: '7', type: 'red' },
      },
      {
        name: 'Évaluations contenu',
        href: '/admin/evaluations',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 11l4-4 3 3 4-5 3 2"/></svg>,
      },
      {
        name: 'Bugs & tickets',
        href: '/admin/bugs',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
        badge: { text: '2', type: 'red' },
      },
    ],
  },
  {
    label: 'Stats avancées',
    items: [
      {
        name: 'Engagement & SRS',
        href: '/admin/engagement',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="10" width="3" height="4"/><rect x="6.5" y="6" width="3" height="8"/><rect x="11" y="2" width="3" height="12"/></svg>,
      },
      {
        name: 'Rétention & cohortes',
        href: '/admin/retention',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="8" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M6 8h2m2-2.5L8 8m2 2.5L8 8"/></svg>,
      },
      {
        name: 'Performance par chapitre',
        href: '/admin/performance',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8h3l2-5 3 10 2-5h4"/></svg>,
      },
    ],
  },
  {
    label: 'Sessions live',
    items: [
      {
        name: 'Créer une session Kahoot',
        href: '/admin/kahoot',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="8" rx="1"/><path d="M6 9l2-2 2 2"/></svg>,
      },
      {
        name: 'Historique des sessions',
        href: '/admin/kahoot/historique',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4.2 4.2l2.1 2.1M9.7 9.7l2.1 2.1M4.2 11.8l2.1-2.1M9.7 6.3l2.1-2.1"/></svg>,
      },
    ],
  },
  {
    label: 'Réglages',
    items: [
      {
        name: 'Configuration app',
        href: '/admin/configuration',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
      },
    ],
  },
]

function Badge({ text, type }: { text: string; type: BadgeType }) {
  const colors = {
    blue: COLORS.badgeBlue,
    amber: COLORS.badgeAmber,
    red: COLORS.badgeRed,
  }
  const c = colors[type]
  return (
    <span style={{
      marginLeft: 'auto',
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '10px',
      fontWeight: 500,
      background: c.bg,
      color: c.text,
      flexShrink: 0,
    }}>
      {text}
    </span>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(item: NavItem): boolean {
    if (item.href === '/admin') return pathname === '/admin'
    if (item.matchPaths) return item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div style={{
      width: '220px',
      minHeight: '100vh',
      background: COLORS.bgSecondary,
      borderRight: `0.5px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: `0.5px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '24px', height: '24px',
          borderRadius: '6px',
          background: '#378ADD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <rect x="2" y="2" width="4" height="4" rx="1"/>
            <rect x="8" y="2" width="4" height="4" rx="1"/>
            <rect x="2" y="8" width="4" height="4" rx="1"/>
            <rect x="8" y="8" width="4" height="4" rx="1"/>
          </svg>
        </div>
        <div>
          <div style={{fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary}}>MedApp</div>
          <div style={{fontSize: '11px', color: COLORS.textTertiary}}>Back-office</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{flex: 1, padding: '4px 0'}}>
        {navSections.map((section) => (
          <div key={section.label} style={{padding: '10px 8px 4px'}}>
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              color: COLORS.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 8px',
              marginBottom: '4px',
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: active ? COLORS.textPrimary : COLORS.textSecondary,
                    fontWeight: active ? 500 : 400,
                    background: active ? COLORS.bgPrimary : 'transparent',
                    border: active ? `0.5px solid ${COLORS.border}` : '0.5px solid transparent',
                    textDecoration: 'none',
                    transition: 'background 0.12s',
                    marginBottom: '1px',
                  }}
                >
                  <span style={{opacity: active ? 1 : 0.7, flexShrink: 0, display: 'flex'}}>
                    {item.icon}
                  </span>
                  <span style={{flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {item.name}
                  </span>
                  {item.badge && <Badge text={item.badge.text} type={item.badge.type} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{padding: '8px', borderTop: `0.5px solid ${COLORS.border}`}}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 8px',
            borderRadius: '8px',
            fontSize: '13px',
            color: COLORS.textSecondary,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/>
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
