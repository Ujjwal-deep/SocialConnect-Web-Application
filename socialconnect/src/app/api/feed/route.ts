import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPrioritizedFeed } from '@/lib/feed'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))

  const { posts, total, hasMore } = await getPrioritizedFeed(supabase, user.id, page, limit)

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
  })
}
