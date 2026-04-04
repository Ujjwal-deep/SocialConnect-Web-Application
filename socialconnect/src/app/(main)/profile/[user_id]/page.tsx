import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfilePageClient from './ProfilePageClient'

export async function generateMetadata({ params }: { params: { user_id: string } }) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, first_name, last_name')
    .eq('id', params.user_id)
    .single()

  if (!profile) return { title: 'Profile — SocialConnect' }
  const name = `${profile.first_name} ${profile.last_name}`.trim() || profile.username
  return {
    title: `${name} (@${profile.username}) — SocialConnect`,
    description: `View ${name}'s profile on SocialConnect`,
  }
}

export default async function ProfilePage({ params }: { params: { user_id: string } }) {
  const supabase = createClient()

  // Auth check (session may be anonymous — profile is public but we need current user for follow state)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch full profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, bio, avatar_url, website, location, posts_count, follower_count, following_count, created_at')
    .eq('id', params.user_id)
    .single()

  if (error || !profile) return notFound()

  // Check if the current user is following this profile
  let isFollowing = false
  const isOwn = user?.id === params.user_id

  if (user && !isOwn) {
    const { data: followRow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', params.user_id)
      .maybeSingle()
    isFollowing = !!followRow
  }

  // Fetch this user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, content, image_url, like_count, comment_count, created_at, author_id,
      profiles:author_id ( id, username, first_name, last_name, avatar_url )
    `)
    .eq('author_id', params.user_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Check likes for current user
  let likedSet = new Set<string>()
  if (user && (posts ?? []).length > 0) {
    const postIds = (posts ?? []).map((p) => p.id)
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    if (likes) likedSet = new Set(likes.map((l: { post_id: string }) => l.post_id))
  }

  const hydratedPosts = (posts ?? []).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
    is_liked_by_me: likedSet.has(p.id),
  }))

  return (
    <ProfilePageClient
      profile={profile}
      posts={hydratedPosts as Parameters<typeof ProfilePageClient>[0]['posts']}
      currentUserId={user?.id ?? null}
      isOwn={isOwn}
      initialIsFollowing={isFollowing}
    />
  )
}
