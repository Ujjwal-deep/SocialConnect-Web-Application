'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, UserCheck, UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useLoading } from '@/components/providers/LoadingProvider'

interface UserEntry {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
  bio: string | null
  posts_count: number
  is_following: boolean
}

interface PeoplePageClientProps {
  initialUsers: UserEntry[]
  currentUserId: string | null
}

function UserAvatar({ user }: { user: Pick<UserEntry, 'first_name' | 'last_name' | 'username' | 'avatar_url'> }) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    || user.username[0]?.toUpperCase() || '?'

  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={`${user.first_name} ${user.last_name}`}
        width={48}
        height={48}
        className="avatar avatar--lg"
        style={{ objectFit: 'cover' }}
      />
    )
  }
  return <div className="avatar--initials avatar--lg" aria-hidden="true">{initials}</div>
}

function UserCard({ user, currentUserId }: { user: UserEntry; currentUserId: string | null }) {
  const [isFollowing, setIsFollowing] = useState(user.is_following)
  const [loading, setLoading] = useState(false)
  const { startLoading } = useLoading()
  const pathname = usePathname()

  const isOwn = currentUserId === user.id
  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.username

  async function handleFollowToggle() {
    if (!currentUserId || isOwn) return
    setLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${user.id}/follow`, { method })
      if (res.ok) setIsFollowing(!isFollowing)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-5)',
      }}
    >
      <Link 
        href={`/profile/${user.id}`} 
        prefetch={false} 
        style={{ flexShrink: 0 }}
        onClick={() => {
          if (pathname !== `/profile/${user.id}`) startLoading()
        }}
      >
        <UserAvatar user={user} />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/profile/${user.id}`}
              prefetch={false}
              style={{ textDecoration: 'none', display: 'block' }}
              onClick={() => {
                if (pathname !== `/profile/${user.id}`) startLoading()
              }}
            >
              <span className="t-username" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block' }}>
                @{user.username}
              </span>
            </Link>
          </div>

          {currentUserId && !isOwn && (
            <button
              id={`follow-btn-${user.id}`}
              className={`btn btn--sm ${isFollowing ? 'btn--secondary' : 'btn--primary'}`}
              onClick={handleFollowToggle}
              disabled={loading}
              style={{ flexShrink: 0 }}
              aria-label={isFollowing ? `Unfollow ${user.username}` : `Follow ${user.username}`}
            >
              {loading ? (
                <Spinner size="sm" />
              ) : isFollowing ? (
                <UserCheck size={13} />
              ) : (
                <UserPlus size={13} />
              )}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          {isOwn && (
            <span className="badge badge--amber" style={{ fontSize: '0.6875rem' }}>You</span>
          )}
        </div>

        {user.bio && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginTop: 'var(--space-2)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {user.bio}
          </p>
        )}

        <div style={{ marginTop: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {user.posts_count} {user.posts_count === 1 ? 'post' : 'posts'}
        </div>
      </div>
    </div>
  )
}

export default function PeoplePageClient({ initialUsers, currentUserId }: PeoplePageClientProps) {
  const [users] = useState(initialUsers)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase()
        return (
          u.username.toLowerCase().includes(q) ||
          u.first_name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q)
        )
      })
    : users

  return (
    <div className="main-content" style={{ maxWidth: 680, padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="t-h1" style={{ marginBottom: 'var(--space-2)' }}>People</h1>
        <p className="t-sm">Discover and connect with others on SocialConnect.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          id="people-search"
          className="form-input"
          placeholder="Search by name or username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* User List */}
      <div className="feed-column">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👥</div>
            <p className="empty-state__title">No users found</p>
            <p className="empty-state__desc">Try a different search term.</p>
          </div>
        ) : (
          filtered.map((user) => (
            <UserCard key={user.id} user={user} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  )
}
