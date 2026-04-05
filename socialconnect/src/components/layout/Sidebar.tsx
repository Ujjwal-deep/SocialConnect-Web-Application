'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, User, LogOut, Users } from 'lucide-react'
import { useLoading } from '@/components/providers/LoadingProvider'

interface SidebarProps {
  user: {
    id: string
    email: string
  }
  profile: {
    username: string
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null
}

export default function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { startLoading } = useLoading()

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase() || profile.username[0]?.toUpperCase() || '?'
    : user.email[0].toUpperCase()

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
    : user.email

  const handle = profile ? `@${profile.username}` : user.email

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    {
      href: '/feed',
      label: 'Feed',
      icon: <Home size={18} className="nav-icon" />,
    },
    {
      href: `/profile/${user.id}`,
      label: 'Profile',
      icon: <User size={18} className="nav-icon" />,
    },
    {
      href: '/people',
      label: 'People',
      icon: <Users size={18} className="nav-icon" />,
    },
  ]

  return (
    <aside className="sidebar">
      <Link 
        href="/feed" 
        className="nav-logo"
        onClick={() => {
          if (pathname !== '/feed') startLoading()
        }}
      >
        Social<span>Connect</span>
      </Link>

      <hr className="divider" style={{ margin: 0 }} />

      <nav className="nav-section">
        {navLinks.map((link) => {
          const isActive =
            link.href === '/feed'
              ? pathname === '/feed'
              : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${isActive ? ' nav-link--active' : ''}`}
              onClick={() => {
                if (pathname !== link.href) startLoading()
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User card with logout button integrated */}
      <div style={{ marginTop: 'auto' }}>
        <Link
          href={`/profile/${user.id}`}
          className="nav-user"
          style={{ textDecoration: 'none' }}
          onClick={() => {
            if (pathname !== `/profile/${user.id}`) startLoading()
          }}
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={32}
              height={32}
              className="avatar avatar--sm"
              style={{ objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="avatar--initials avatar--sm" aria-hidden="true">
              {initials}
            </div>
          )}
          <div className="nav-user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="nav-user-name">{displayName}</div>
            <div className="nav-user-handle">{handle}</div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleLogout()
            }}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              flexShrink: 0,
              transition: 'color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#E24B4A'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(226,75,74,0.1)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
            }}
          >
            <LogOut size={16} />
          </button>
        </Link>
      </div>
    </aside>
  )
}
