'use client'

import { useState } from 'react'
import { UserCheck, UserPlus } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({ targetUserId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)
    const method = isFollowing ? 'DELETE' : 'POST'
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Action failed')
      const newState = !isFollowing
      setIsFollowing(newState)
      onFollowChange?.(newState)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        id={`follow-btn-${targetUserId}`}
        onClick={handleToggle}
        disabled={loading}
        className={`btn ${isFollowing ? 'btn--secondary' : 'btn--primary'} btn--sm`}
        style={{ minWidth: 110 }}
        aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : isFollowing ? (
          <UserCheck size={14} />
        ) : (
          <UserPlus size={14} />
        )}
        {loading ? 'Loading…' : isFollowing ? 'Following' : 'Follow'}
      </button>
      {error && (
        <p className="form-error" style={{ marginTop: 4, fontSize: '0.75rem' }}>{error}</p>
      )}
    </div>
  )
}
