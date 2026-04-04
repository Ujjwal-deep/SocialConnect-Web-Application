import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  // Check post exists
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, like_count')
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }

  // Insert like (ignore duplicate errors)
  const { error: likeError } = await supabase
    .from('likes')
    .insert({ post_id: params.post_id, user_id: user.id })

  if (likeError && !likeError.message.includes('duplicate')) {
    return NextResponse.json({ error: likeError.message, status: 500 }, { status: 500 })
  }

  // Increment like_count using admin client to bypass RLS
  const adminClient = createAdminClient()
  await adminClient
    .from('posts')
    .update({ like_count: (post.like_count ?? 0) + 1 })
    .eq('id', params.post_id)

  return NextResponse.json({ liked: true, like_count: (post.like_count ?? 0) + 1 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, like_count')
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', params.post_id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message, status: 500 }, { status: 500 })
  }

  const newCount = Math.max(0, (post.like_count ?? 1) - 1)
  
  // Decrement like_count using admin client to bypass RLS
  const adminClient = createAdminClient()
  await adminClient
    .from('posts')
    .update({ like_count: newCount })
    .eq('id', params.post_id)

  return NextResponse.json({ liked: false, like_count: newCount })
}
