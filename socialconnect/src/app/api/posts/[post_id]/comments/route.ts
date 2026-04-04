import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      author_id,
      profiles:author_id (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('post_id', params.post_id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message, status: 500 }, { status: 500 })
  }

  return NextResponse.json({ comments })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const content = String(body.content ?? '').trim()

  if (!content) {
    return NextResponse.json({ error: 'Content is required', status: 400 }, { status: 400 })
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Comment must be 500 characters or fewer', status: 400 }, { status: 400 })
  }

  // Check post exists
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, comment_count')
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }

  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({ post_id: params.post_id, author_id: user.id, content })
    .select(`
      id,
      content,
      created_at,
      author_id,
      profiles:author_id (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message, status: 500 }, { status: 500 })
  }

  // Increment comment_count using admin client to bypass RLS
  const adminClient = createAdminClient()
  await adminClient
    .from('posts')
    .update({ comment_count: (post.comment_count ?? 0) + 1 })
    .eq('id', params.post_id)

  return NextResponse.json({ comment }, { status: 201 })
}
