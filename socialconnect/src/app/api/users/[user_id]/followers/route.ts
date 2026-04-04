import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/users/[user_id]/followers
export async function GET(
  _request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('follows')
      .select('profiles!follows_follower_id_fkey(id, username, avatar_url, first_name, last_name)')
      .eq('following_id', params.user_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, status: 500 }, { status: 500 })
    }

    const followers = (data ?? []).map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return p
    }).filter(Boolean)

    return NextResponse.json({ followers })
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
