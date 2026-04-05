import { SupabaseClient } from '@supabase/supabase-js'

export interface PostAuthor {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export interface FeedPost {
  id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  created_at: string
  author_id: string
  profiles: PostAuthor
  is_liked_by_me: boolean
}

export async function getPrioritizedFeed(
  supabase: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit

  // 1. Get the list of IDs this user follows (plus themselves)
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followedIds = [
    userId,
    ...(followingRows ?? []).map((r: any) => r.following_id)
  ]

  const postFields = `
    id, content, image_url, like_count, comment_count, created_at, author_id,
    profiles:author_id ( id, username, first_name, last_name, avatar_url )
  `

  // 2. Count total prioritized (followed + self) posts
  const { count: followedCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .in('author_id', followedIds)

  const totalFollowed = followedCount ?? 0
  let posts: any[] = []

  // 3. Determine if we are in the "Followed" bucket, the "Others" bucket, or the transition
  if (offset < totalFollowed) {
    // Current page starts in the followed bucket
    const { data: followedPosts } = await supabase
      .from('posts')
      .select(postFields)
      .eq('is_active', true)
      .in('author_id', followedIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    posts = followedPosts ?? []

    // If we have room left in this page, pull from the "others" bucket
    if (posts.length < limit) {
      const remainingSlots = limit - posts.length
      const { data: otherPosts } = await supabase
        .from('posts')
        .select(postFields)
        .eq('is_active', true)
        .not('author_id', 'in', `(${followedIds.join(',')})`)
        .order('created_at', { ascending: false })
        .range(0, remainingSlots - 1)

      if (otherPosts) {
        posts = [...posts, ...otherPosts]
      }
    }
  } else {
    // Current page is entirely in the "Others" bucket
    const othersOffset = offset - totalFollowed
    const { data: otherPosts } = await supabase
      .from('posts')
      .select(postFields)
      .eq('is_active', true)
      .not('author_id', 'in', `(${followedIds.join(',')})`)
      .order('created_at', { ascending: false })
      .range(othersOffset, othersOffset + limit - 1)

    posts = otherPosts ?? []
  }

  // 4. Get total count of ALL active posts for hasMore logic
  const { count: totalCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const total = totalCount ?? 0

  // 5. Hydrate is_liked_by_me
  const postIds = posts.map((p) => p.id)
  let likedPostIds = new Set<string>()

  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (likes) {
      likedPostIds = new Set(likes.map((l: any) => l.post_id))
    }
  }

  const hydratedPosts = posts.map((post: any) => ({
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
    is_liked_by_me: likedPostIds.has(post.id),
  }))

  return {
    posts: hydratedPosts,
    total,
    hasMore: total > offset + limit
  }
}
