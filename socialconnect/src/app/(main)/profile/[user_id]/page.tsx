import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function ProfilePage({
  params,
}: {
  params: { user_id: string }
}) {
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.user_id)
    .single()

  if (error || !profile) {
    return notFound()
  }

  return (
    <div className="main-content">
      <div className="flex items-center gap-6 mb-8">
        <div className="avatar--initials avatar--xl">
          {profile.first_name[0]}{profile.last_name[0]}
        </div>
        <div>
          <h1 className="t-h1 text-text-primary capitalize">{profile.first_name} {profile.last_name}</h1>
          <p className="t-username text-accent">@{profile.username}</p>
        </div>
      </div>

      <div className="card text-text-secondary">
        <p>This is the profile for user <span className="text-accent">{profile.username}</span>.</p>
        <p className="mt-4 t-sm text-text-muted">Bio: {profile.bio || "No bio yet."}</p>
      </div>
    </div>
  )
}
