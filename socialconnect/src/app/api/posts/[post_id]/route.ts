import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_CONTENT_LENGTH = 280
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const POST_SELECT = `
  id,
  content,
  image_url,
  like_count,
  comment_count,
  created_at,
  updated_at,
  author_id,
  profiles:author_id (
    id,
    username,
    first_name,
    last_name,
    avatar_url
  )
`

export async function GET(
  _req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ post })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, image_url')
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }
  if (existing.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden', status: 403 }, { status: 403 })
  }

  const updates: { content?: string; image_url?: string | null } = {}

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const content = (formData.get('content') as string)?.trim()
    const imageFile = formData.get('image') as File | null

    if (content !== undefined) {
      if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer`, status: 400 }, { status: 400 })
      }
      updates.content = content
    }

    if (imageFile && imageFile.size > 0) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Image must be JPEG or PNG', status: 400 }, { status: 400 })
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image must be 2MB or smaller', status: 400 }, { status: 400 })
      }

      const timestamp = Date.now()
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const uploadPath = `${user.id}/${timestamp}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(uploadPath, imageFile, { contentType: imageFile.type })

      if (uploadError) {
        return NextResponse.json({ error: `Image upload failed: ${uploadError.message}`, status: 500 }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(uploadPath)
      updates.image_url = urlData.publicUrl
    }
  } else {
    const body = await request.json().catch(() => ({}))
    if (body.content !== undefined) {
      const content = String(body.content).trim()
      if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer`, status: 400 }, { status: 400 })
      }
      updates.content = content
    }
    if ('image_url' in body) {
      updates.image_url = body.image_url ?? null
    }
  }

  const { data: post, error: updateError } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.post_id)
    .select(POST_SELECT)
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message, status: 500 }, { status: 500 })
  }

  return NextResponse.json({ post })
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

  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', params.post_id)
    .eq('is_active', true)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found', status: 404 }, { status: 404 })
  }
  if (existing.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden', status: 403 }, { status: 403 })
  }

  const adminSupabase = createAdminClient()
  const { error: deleteError } = await adminSupabase
    .from('posts')
    .update({ is_active: false })
    .eq('id', params.post_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message, status: 500 }, { status: 500 })
  }

  // Decrement posts_count
  const { data: profile } = await supabase
    .from('profiles')
    .select('posts_count')
    .eq('id', user.id)
    .single()

  if (profile) {
    await adminSupabase
      .from('profiles')
      .update({ posts_count: Math.max(0, (profile.posts_count ?? 1) - 1) })
      .eq('id', user.id)
  }

  return NextResponse.json({ success: true })
}
