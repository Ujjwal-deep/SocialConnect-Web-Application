import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  // Get all active posts (chronological), include author info
  const { data: posts, error, count } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      image_url,
      like_count,
      comment_count,
      created_at,
      author_id,
      profiles:author_id (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message, status: 500 }, { status: 500 })
  }

  // Get likes for this user on these posts
  const postIds = (posts ?? []).map((p: { id: string }) => p.id)
  let likedPostIds = new Set<string>()

  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    if (likes) {
      likedPostIds = new Set(likes.map((l: { post_id: string }) => l.post_id))
    }
  }

  const postsWithLikes = (posts ?? []).map((post: { id: string; [key: string]: unknown }) => ({
    ...post,
    is_liked_by_me: likedPostIds.has(post.id),
  }))

  return NextResponse.json({
    posts: postsWithLikes,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    },
  })
}
