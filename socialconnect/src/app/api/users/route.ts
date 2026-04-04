import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Auth required
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit

    const { data: profiles, error, count } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio, posts_count', { count: 'exact' })
      .order('username', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message, status: 500 }, { status: 500 })
    }

    return NextResponse.json({
      users: profiles ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        hasMore: (count ?? 0) > offset + limit,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
