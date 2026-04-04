'use client'

import { useState, useRef, useCallback } from 'react'
import { Loader2, Camera, X } from 'lucide-react'

interface Profile {
  first_name: string
  last_name: string
  bio: string | null
  website: string | null
  location: string | null
  avatar_url: string | null
  username: string
}

interface EditProfileDialogProps {
  profile: Profile
  onSaved: (updated: Profile) => void
}

export default function EditProfileDialog({ profile, onSaved }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Avatar must be JPEG or PNG')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar must be under 2MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }, [])

  const clearAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      formData.append('bio', bio)
      formData.append('website', website)
      formData.append('location', location)
      if (avatarFile) formData.append('avatar', avatarFile)

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save profile')

      onSaved(json)
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const bioLength = bio.length

  const currentAvatar = avatarPreview ?? profile.avatar_url
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || profile.username[0]?.toUpperCase() || '?'

  if (!open) {
    return (
      <button
        id="edit-profile-btn"
        className="btn btn--secondary btn--sm"
        onClick={() => setOpen(true)}
      >
        Edit Profile
      </button>
    )
  }

  return (
    // Backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div
        className="dialog-content"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid #4A3F2E',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <h2 id="edit-profile-title" className="t-h2">Edit Profile</h2>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            style={{ padding: '4px 8px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt="Avatar preview"
                className="avatar avatar--xl"
              />
            ) : (
              <div className="avatar--initials avatar--xl">{initials}</div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--accent)',
                border: '2px solid var(--surface-overlay)',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-inverse)',
              }}
              aria-label="Change avatar"
            >
              <Camera size={14} />
            </button>
          </div>

          {avatarPreview && (
            <button className="btn btn--ghost btn--sm" onClick={clearAvatar} style={{ fontSize: '0.75rem' }}>
              <X size={12} /> Remove new avatar
            </button>
          )}

          <input
            ref={fileInputRef}
            id="avatar-upload-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <p className="t-xs" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>JPEG or PNG, max 2MB</p>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-first-name">First Name</label>
              <input
                id="edit-first-name"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-last-name">Last Name</label>
              <input
                id="edit-last-name"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                maxLength={50}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              className={`form-textarea${bioLength > 160 ? ' form-input--error' : ''}`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself…"
              rows={3}
              maxLength={180}
              style={{ resize: 'none' }}
            />
            <span className={`char-count${bioLength > 140 ? (bioLength > 160 ? ' char-count--danger' : ' char-count--warning') : ''}`}>
              {bioLength}/160
            </span>
          </div>

          {/* Website */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-website">Website</label>
            <input
              id="edit-website"
              className="form-input"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-location">Location</label>
            <input
              id="edit-location"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              maxLength={100}
            />
          </div>

          {/* Error */}
          {error && <p className="form-error">{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              id="save-profile-btn"
              type="button"
              className={`btn btn--primary${saving ? ' btn--loading' : ''}`}
              onClick={handleSave}
              disabled={saving || bioLength > 160}
            >
              {saving && <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
