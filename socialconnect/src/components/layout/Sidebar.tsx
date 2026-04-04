'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, User, LogOut, Users } from 'lucide-react'

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

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : user.email[0].toUpperCase()

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
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
      <Link href="/feed" className="nav-logo">
        Social<span>Connect</span>
      </Link>

      <hr className="divider" style={{ margin: 0 }} />

      <nav className="nav-section">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/feed' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          className="nav-link btn--ghost"
          style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer', background: 'none', border: '1px solid transparent' }}
        >
          <LogOut size={18} className="nav-icon" />
          Sign out
        </button>

        <div className="nav-user" style={{ marginTop: '12px' }}>
          <div className="avatar--initials avatar--sm" aria-hidden="true">
            {initials}
          </div>
          <div className="nav-user-info">
            <div className="nav-user-name">{displayName}</div>
            <div className="nav-user-handle">{handle}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
