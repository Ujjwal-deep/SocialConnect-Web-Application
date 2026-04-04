import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="main-content">
      <h1 className="t-h1 mb-6">Your Feed</h1>
      <div className="card text-text-secondary">
        <p>Welcome, <span className="text-accent font-bold">@{user.email?.split('@')[0]}</span>.</p>
        <p className="mt-2">The feed is being prepared for Phase 2. This route is protected and only accessible to signed-in users.</p>
      </div>
    </div>
  )
}
