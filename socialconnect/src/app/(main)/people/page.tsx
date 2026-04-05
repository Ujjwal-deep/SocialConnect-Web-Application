import { createClient } from '@/lib/supabase/server'
import PeoplePageClient from './PeoplePageClient'

export const metadata = {
  title: 'People — SocialConnect',
  description: 'Discover and connect with people on SocialConnect',
}

export default async function PeoplePage() {
  // Add a small artificial delay to ensure the Luma Spinner is visible
  // for a consistent UX, even if the data fetch is nearly instant.
  await new Promise((resolve) => setTimeout(resolve, 800))
  
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch first page of users
  const { data: usersData } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, posts_count, first_name, last_name')
    .order('username', { ascending: true })
    .range(0, 19)

  // Get who the current user is already following
  let followingSet = new Set<string>()
  if (user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    follows?.forEach((f: { following_id: string }) => followingSet.add(f.following_id))
  }

  const users = (usersData ?? []).map((u) => ({
    ...u,
    is_following: followingSet.has(u.id),
  }))

  return (
    <PeoplePageClient
      initialUsers={users}
      currentUserId={user?.id ?? null}
    />
  )
}
