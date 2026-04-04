'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MAX_CHARS = 280
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

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

interface NewPostDialogProps {
  currentUserId: string
  profile: Author | null
  onPostCreated: (post: Post) => void
  trigger?: React.ReactNode
}

export default function NewPostDialog({ currentUserId, profile, onPostCreated, trigger }: NewPostDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charsLeft = MAX_CHARS - content.length
  const charClass = charsLeft < 0 ? 'char-count--danger' : charsLeft < 30 ? 'char-count--warning' : ''

  const initials = profile
    ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()
    : '?'

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Image must be JPEG or PNG')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 2MB or smaller')
      return
    }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetForm() {
    setContent('')
    setImageFile(null)
    setImagePreview(null)
    setError(null)
    setSubmitting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) { setError('Write something first'); return }
    if (trimmed.length > MAX_CHARS) { setError(`Max ${MAX_CHARS} characters`); return }

    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('content', trimmed)
    if (imageFile) formData.append('image', imageFile)

    try {
      const res = await fetch('/api/posts', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        return
      }

      onPostCreated(json.post)
      resetForm()
      setOpen(false)
    } catch {
      setError('Network error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="btn btn--primary">New Post</button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="avatar--initials avatar--md">{initials}</div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {profile ? `${profile.first_name} ${profile.last_name}` : 'You'}
            </span>
          </div>

          {/* Textarea */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <textarea
              id="post-content"
              className="form-textarea"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              style={{ minHeight: 120 }}
              autoFocus
            />
            <div className={`char-count ${charClass}`}>
              {Math.abs(charsLeft)} {charsLeft < 0 ? 'characters over' : 'characters remaining'}
            </div>
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div style={{ position: 'relative', marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: 240,
                  objectFit: 'cover',
                  border: '1px solid var(--surface-muted)',
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(13,12,10,0.75)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>
          )}

          {/* Footer row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                id="post-image-upload"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="post-action-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add image"
              >
                <ImagePlus size={18} />
                <span>Photo</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn--ghost btn--sm"
                onClick={() => { setOpen(false); resetForm() }}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-new-post"
                className="btn btn--primary btn--sm"
                disabled={submitting || content.trim().length === 0 || content.length > MAX_CHARS}
                style={{ opacity: submitting || content.trim().length === 0 ? 0.6 : 1 }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                    Posting…
                  </span>
                ) : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
