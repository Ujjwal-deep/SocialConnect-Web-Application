'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, MapPin, Calendar, ExternalLink } from 'lucide-react'
import PostCard from '@/components/posts/PostCard'
import FollowButton from '@/components/profile/FollowButton'
import EditProfileDialog from '@/components/profile/EditProfileDialog'

interface Author {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Post {
  id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  created_at: string
  author_id: string
  profiles: Author
  is_liked_by_me: boolean
}

interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  bio: string | null
  avatar_url: string | null
  website: string | null
  location: string | null
  posts_count: number
  follower_count: number
  following_count: number
  created_at: string
}

interface ProfilePageClientProps {
  profile: Profile
  posts: Post[]
  currentUserId: string | null
  isOwn: boolean
  initialIsFollowing: boolean
}

function Avatar({ profile, size = 'xl' }: { profile: { first_name: string; last_name: string; username: string; avatar_url: string | null }; size?: string }) {
  const initials = `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    || profile.username[0]?.toUpperCase() || '?'

  if (profile.avatar_url) {
    const sizeMap: Record<string, number> = { xl: 80, '2xl': 112 }
    const px = sizeMap[size] ?? 80
    return (
      <Image
        src={profile.avatar_url}
        alt={`${profile.first_name} ${profile.last_name}`}
        width={px}
        height={px}
        className={`avatar avatar--${size}`}
        style={{ objectFit: 'cover' }}
      />
    )
  }

  return <div className={`avatar--initials avatar--${size}`} aria-hidden="true">{initials}</div>
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ProfilePageClient({
  profile: initialProfile,
  posts: initialPosts,
  currentUserId,
  isOwn,
  initialIsFollowing,
}: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [posts, setPosts] = useState(initialPosts)
  const [followerCount, setFollowerCount] = useState(initialProfile.follower_count)

  function handleFollowChange(isFollowing: boolean) {
    setFollowerCount((c) => c + (isFollowing ? 1 : -1))
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function handleProfileSaved(updated: Partial<Profile>) {
    setProfile((prev) => ({ ...prev, ...updated }))
  }

  const displayName = `${profile.first_name} ${profile.last_name}`.trim() || profile.username

  return (
    <div className="main-content" style={{ maxWidth: 680, padding: 'var(--space-8) var(--space-6)' }}>
      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
        {/* Top row: avatar + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <Avatar profile={profile} size="2xl" />

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {isOwn ? (
              <EditProfileDialog
                profile={{
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  bio: profile.bio,
                  website: profile.website,
                  location: profile.location,
                  avatar_url: profile.avatar_url,
                  username: profile.username,
                }}
                onSaved={handleProfileSaved}
              />
            ) : currentUserId ? (
              <FollowButton
                targetUserId={profile.id}
                initialIsFollowing={initialIsFollowing}
                onFollowChange={handleFollowChange}
              />
            ) : (
              <Link href="/login" className="btn btn--primary btn--sm">Follow</Link>
            )}
          </div>
        </div>

        {/* Name & Handle */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <h1 className="t-h1" style={{ fontSize: '1.5rem', marginBottom: 2 }}>{displayName}</h1>
          <p style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem' }}>
            @{profile.username}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="t-body" style={{ marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {profile.bio}
          </p>
        )}

        {/* Meta info row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {profile.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', textDecoration: 'none' }}
            >
              <Globe size={14} />
              {profile.website.replace(/^https?:\/\//, '')}
              <ExternalLink size={11} />
            </a>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={14} />
            Joined {formatMemberSince(profile.created_at)}
          </span>
        </div>

        {/* Stats */}
        <div className="stat-group" style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--surface-muted)' }}>
          <div className="stat-item">
            <span className="stat-value">{profile.posts_count}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{followerCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.following_count}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--space-4)', fontSize: '1.125rem' }}>
          Posts
        </h2>
      </div>

      <div className="feed-column">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📝</div>
            <p className="empty-state__title">No posts yet</p>
            <p className="empty-state__desc">
              {isOwn ? "Share something with your followers!" : `${displayName} hasn't posted anything yet.`}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId ?? ''}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  )
}
