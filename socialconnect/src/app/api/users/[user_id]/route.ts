import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, bio, avatar_url, website, location, posts_count, follower_count, following_count, created_at')
      .eq('id', params.user_id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found', status: 404 }, { status: 404 })
    }

    // Check if current user is following this profile
    const { data: { user } } = await supabase.auth.getUser()
    let is_following = false
    if (user && user.id !== params.user_id) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', params.user_id)
        .maybeSingle()
      is_following = !!follow
    }

    return NextResponse.json({ ...profile, is_following })
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
