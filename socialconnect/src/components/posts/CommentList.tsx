'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Send, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface Author {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  profiles: Author
}

interface CommentListProps {
  postId: string
  currentUserId: string
  initialCommentCount?: number
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CommentList({ postId, currentUserId, initialCommentCount = 0 }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      const json = await res.json()
      if (res.ok) setComments(json.comments ?? [])
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { fetchComments() }, [fetchComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to post comment')
        return
      }

      setComments((prev) => [...prev, json.comment])
      setContent('')
    } catch {
      setError('Network error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Delete this comment?')) return
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h2 className="t-h2" style={{ marginBottom: 16, fontSize: '1.125rem' }}>
        Comments {comments.length > 0 && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.9375rem' }}>({comments.length})</span>}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <Spinner size="md" />
        </div>
      ) : comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state__icon">💬</div>
          <p className="empty-state__title">No comments yet</p>
          <p className="empty-state__desc">Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {comments.map((comment) => {
            const author = comment.profiles
            const initials = `${author.first_name[0] ?? ''}${author.last_name[0] ?? ''}`.toUpperCase()
            const isOwn = comment.author_id === currentUserId

            return (
              <div key={comment.id} className="comment">
                <div className="avatar--initials avatar--sm" aria-hidden="true">{initials}</div>
                <div className="comment__body">
                  <div className="comment__header">
                    <Link href={`/profile/${author.id}`} className="comment__author">
                      {author.first_name} {author.last_name}
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{author.username}</span>
                    <span className="comment__time">· {formatTimeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6B5F50',
                          padding: '2px 4px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 150ms ease',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#E24B4A' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6B5F50' }}
                        aria-label="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="comment__content">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--surface-muted)', paddingTop: 20 }}>
        <div className="form-group">
          <textarea
            id="add-comment-input"
            className="form-textarea"
            placeholder="Write a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            style={{ minHeight: 72 }}
            disabled={submitting}
          />
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              id="submit-comment"
              className="btn btn--primary btn--sm"
              disabled={submitting || content.trim().length === 0}
              style={{ opacity: submitting || content.trim().length === 0 ? 0.6 : 1 }}
            >
              {submitting ? (
                <Spinner size="sm" />
              ) : (
                <Send size={14} />
              )}
              {submitting ? 'Posting…' : 'Comment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
