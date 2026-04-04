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

  // Get list of users the current user follows
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followedIds = (followingRows ?? []).map((r: { following_id: string }) => r.following_id)

  let posts: Record<string, unknown>[] = []
  let total = 0

  if (followedIds.length > 0) {
    // Fetch followed users' posts first (chronological), then fill with others
    const postFields = `
      id, content, image_url, like_count, comment_count, created_at, author_id,
      profiles:author_id ( id, username, first_name, last_name, avatar_url )
    `

    // Followed users' posts
    const { data: followedPosts, count: followedCount } = await supabase
      .from('posts')
      .select(postFields, { count: 'exact' })
      .eq('is_active', true)
      .in('author_id', followedIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const followedPostsArr = followedPosts ?? []
    total = followedCount ?? 0

    // If we still have room in this page, pad with non-followed posts
    const remainingSlots = limit - followedPostsArr.length
    let otherPosts: Record<string, unknown>[] = []

    if (page === 1 && remainingSlots > 0 && (followedCount ?? 0) <= limit) {
      const followedPostIds = followedPostsArr.map((p: Record<string, unknown>) => p.id as string)
      const excludeIds = [...followedIds, ...(followedPostIds.length > 0 ? [] : [])]

      const { data: others, count: othersCount } = await supabase
        .from('posts')
        .select(postFields, { count: 'exact' })
        .eq('is_active', true)
        .not('author_id', 'in', `(${[...followedIds, user.id].join(',')})`)
        .order('created_at', { ascending: false })
        .range(0, remainingSlots - 1)

      otherPosts = (others ?? []) as Record<string, unknown>[]
      total += (othersCount ?? 0)
    }

    posts = [...followedPostsArr as Record<string, unknown>[], ...otherPosts]
  } else {
    // No follows — return all public posts chronologically
    const { data: allPosts, count } = await supabase
      .from('posts')
      .select(`
        id, content, image_url, like_count, comment_count, created_at, author_id,
        profiles:author_id ( id, username, first_name, last_name, avatar_url )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    posts = (allPosts ?? []) as Record<string, unknown>[]
    total = count ?? 0
  }

  // Hydrate is_liked_by_me
  const postIds = posts.map((p) => p.id as string)
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

  const postsWithLikes = posts.map((post) => ({
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
    is_liked_by_me: likedPostIds.has(post.id as string),
  }))

  return NextResponse.json({
    posts: postsWithLikes,
    pagination: {
      page,
      limit,
      total,
      hasMore: total > offset + limit,
    },
  })
}
