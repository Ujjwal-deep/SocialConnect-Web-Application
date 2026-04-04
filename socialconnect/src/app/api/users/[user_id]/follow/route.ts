import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/users/[user_id]/follow — follow a user
export async function POST(
  _request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
    }

    if (user.id === params.user_id) {
      return NextResponse.json({ error: 'You cannot follow yourself', status: 400 }, { status: 400 })
    }

    // Check target user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found', status: 404 }, { status: 404 })
    }

    // Check already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', params.user_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already following this user', status: 409 }, { status: 409 })
    }

    // Insert follow record
    const { error: followError } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: params.user_id })

    if (followError) {
      return NextResponse.json({ error: followError.message, status: 500 }, { status: 500 })
    }

    // Update counts atomically using admin client (bypasses RLS)
    const admin = createAdminClient()
    await Promise.all([
      // Increment follower_count on the target user
      admin.rpc('increment_follower_count', { target_id: params.user_id }),
      // Increment following_count on the current user
      admin.rpc('increment_following_count', { target_id: user.id }),
    ])

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}

// DELETE /api/users/[user_id]/follow — unfollow a user
export async function DELETE(
  _request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', params.user_id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message, status: 500 }, { status: 500 })
    }

    // Update counts atomically using admin client (bypasses RLS)
    const admin = createAdminClient()
    await Promise.all([
      admin.rpc('decrement_follower_count', { target_id: params.user_id }),
      admin.rpc('decrement_following_count', { target_id: user.id }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
