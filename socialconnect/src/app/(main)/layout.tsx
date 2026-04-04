import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="app-shell bg-surface-base min-h-screen">
      <Sidebar
        user={{ id: user.id, email: user.email ?? '' }}
        profile={profile}
      />
      <main>
        {children}
      </main>
    </div>
  )
}
