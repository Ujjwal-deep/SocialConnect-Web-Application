'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Trash2, MoreHorizontal } from 'lucide-react'
import { useLoading } from '@/components/providers/LoadingProvider'
import { usePathname } from 'next/navigation'

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
  is_liked_by_me?: boolean
}

interface PostCardProps {
  post: Post
  currentUserId: string
  onDelete?: (postId: string) => void
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AuthorAvatar({ author, size = 'md' }: { author: Author; size?: string }) {
  const initials = `${author.first_name[0] ?? ''}${author.last_name[0] ?? ''}`.toUpperCase()

  if (author.avatar_url) {
    return (
      <Image
        src={author.avatar_url}
        alt={`${author.first_name} ${author.last_name}`}
        width={40}
        height={40}
        className={`avatar avatar--${size}`}
      />
    )
  }

  return (
    <div className={`avatar--initials avatar--${size}`} aria-hidden="true">
      {initials}
    </div>
  )
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked_by_me ?? false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { startLoading } = useLoading()
  const pathname = usePathname()

  const author = post.profiles
  const isAuthor = post.author_id === currentUserId

  async function handleLikeToggle() {
    if (likeLoading) return
    setLikeLoading(true)

    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => c + (newLiked ? 1 : -1))

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      })
      if (!res.ok) {
        // Revert on failure
        setLiked(!newLiked)
        setLikeCount((c) => c + (newLiked ? -1 : 1))
      }
    } catch {
      setLiked(!newLiked)
      setLikeCount((c) => c + (newLiked ? -1 : 1))
    } finally {
      setLikeLoading(false)
    }
  }

  async function handleDelete() {
    if (deleteLoading || !window.confirm('Delete this post?')) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete?.(post.id)
      }
    } finally {
      setDeleteLoading(false)
      setMenuOpen(false)
    }
  }

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card__header">
        <Link 
          href={`/profile/${author.id}`}
          onClick={() => {
            if (pathname !== `/profile/${author.id}`) startLoading()
          }}
        >
          <AuthorAvatar author={author} size="md" />
        </Link>

        <div className="post-card__author-info">
          <Link 
            href={`/profile/${author.id}`} 
            className="post-card__author-name"
            onClick={() => {
              if (pathname !== `/profile/${author.id}`) startLoading()
            }}
          >
            {author.first_name} {author.last_name}
          </Link>
          <div className="post-card__meta">
            <span>@{author.username}</span>
            <span>·</span>
            <span>{formatTimeAgo(post.created_at)}</span>
          </div>
        </div>

        {isAuthor && (
          <div style={{ position: 'relative' }}>
            <button
              className="post-action-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'var(--surface-overlay)',
                  border: '1px solid var(--surface-muted)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  zIndex: 10,
                  minWidth: 120,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#E24B4A',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(226,75,74,0.1)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                >
                  <Trash2 size={14} />
                  {deleteLoading ? 'Deleting…' : 'Delete post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="post-card__content">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <Image
          src={post.image_url}
          alt="Post image"
          width={640}
          height={400}
          className="post-card__image"
          style={{ height: 'auto', maxHeight: 400 }}
        />
      )}

      {/* Actions */}
      <div className="post-card__actions">
        <button
          id={`like-btn-${post.id}`}
          className={`post-action-btn${liked ? ' post-action-btn--liked' : ''}`}
          onClick={handleLikeToggle}
          disabled={likeLoading}
          aria-label={liked ? 'Unlike' : 'Like'}
          style={{ transition: 'transform 150ms ease' }}
        >
          <Heart
            size={16}
            fill={liked ? 'currentColor' : 'none'}
            style={{ transition: 'transform 200ms ease', transform: liked ? 'scale(1.2)' : 'scale(1)' }}
          />
          <span>{likeCount > 0 ? likeCount : ''}</span>
        </button>

        <Link
          href={`/posts/${post.id}`}
          className="post-action-btn"
          style={{ textDecoration: 'none' }}
          onClick={() => {
            if (pathname !== `/posts/${post.id}`) startLoading()
          }}
        >
          <MessageCircle size={16} />
          <span>{post.comment_count > 0 ? post.comment_count : ''}</span>
        </Link>
      </div>
    </article>
  )
}
