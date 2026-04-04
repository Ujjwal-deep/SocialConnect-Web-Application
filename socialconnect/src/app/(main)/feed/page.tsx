import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedPageClient from './FeedPageClient'

export const metadata = {
  title: 'Feed — SocialConnect',
  description: 'Your SocialConnect feed',
}

export default async function FeedPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch initial page of feed posts
  const { data: posts, count } = await supabase
    .from('posts')
    .select(`
      id, content, image_url, like_count, comment_count, created_at, author_id,
      profiles:author_id ( id, username, first_name, last_name, avatar_url )
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 9)

  // Check which posts the current user has liked
  const postIds = (posts ?? []).map((p) => p.id)
  let likedSet = new Set<string>()
  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    if (likes) likedSet = new Set(likes.map((l: { post_id: string }) => l.post_id))
  }

  const hydratedPosts = (posts ?? []).map((p) => ({
    ...p,
    is_liked_by_me: likedSet.has(p.id),
    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
  }))

  const hasMore = (count ?? 0) > 10

  return (
    <FeedPageClient
      initialPosts={hydratedPosts as Parameters<typeof FeedPageClient>[0]['initialPosts']}
      initialHasMore={hasMore}
      currentUserId={user.id}
      profile={profile ?? null}
    />
  )
}
