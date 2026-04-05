import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPrioritizedFeed } from '@/lib/feed'
import FeedPageClient from './FeedPageClient'

export const metadata = {
  title: 'Feed — SocialConnect',
  description: 'Your SocialConnect feed',
}

export default async function FeedPage() {
  // Add a small artificial delay to ensure the Luma Spinner is visible
  // for a consistent UX, even if the data fetch is nearly instant.
  await new Promise((resolve) => setTimeout(resolve, 800))
  
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch initial page of prioritized feed posts
  const { posts, hasMore } = await getPrioritizedFeed(supabase, user.id, 1, 10)

  return (
    <FeedPageClient
      initialPosts={posts as Parameters<typeof FeedPageClient>[0]['initialPosts']}
      initialHasMore={hasMore}
      currentUserId={user.id}
      profile={profile ?? null}
    />
  )
}
