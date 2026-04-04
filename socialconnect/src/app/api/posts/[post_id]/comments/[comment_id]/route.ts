import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { post_id: string; comment_id: string } }
) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', params.comment_id)
    .eq('post_id', params.post_id)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Comment not found', status: 404 }, { status: 404 })
  }
  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden', status: 403 }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', params.comment_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message, status: 500 }, { status: 500 })
  }

  // Decrement comment_count using admin client to bypass RLS
  const { data: post } = await supabase
    .from('posts')
    .select('comment_count')
    .eq('id', params.post_id)
    .single()

  if (post) {
    const adminClient = createAdminClient()
    await adminClient
      .from('posts')
      .update({ comment_count: Math.max(0, (post.comment_count ?? 1) - 1) })
      .eq('id', params.post_id)
  }

  return NextResponse.json({ success: true })
}

