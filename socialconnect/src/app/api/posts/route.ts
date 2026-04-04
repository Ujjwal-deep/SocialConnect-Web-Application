import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_CONTENT_LENGTH = 280
const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  const { data: posts, error, count } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      image_url,
      like_count,
      comment_count,
      created_at,
      author_id,
      profiles:author_id (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    },
  })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
  }

  let content: string
  let imageFile: File | null = null

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    content = (formData.get('content') as string) ?? ''
    imageFile = (formData.get('image') as File) ?? null
  } else {
    const body = await request.json().catch(() => ({}))
    content = body.content ?? ''
  }

  content = content.trim()
  if (!content) {
    return NextResponse.json({ error: 'Content is required', status: 400 }, { status: 400 })
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer`, status: 400 }, { status: 400 })
  }

  let imageUrl: string | null = null

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
      .upload(uploadPath, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}`, status: 500 }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(uploadPath)

    imageUrl = urlData.publicUrl
  }

  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content,
      image_url: imageUrl,
      is_active: true,
    })
    .select(`
      id,
      content,
      image_url,
      like_count,
      comment_count,
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

  // Increment posts_count on the profile (direct update — no RPC needed)
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('posts_count')
      .eq('id', user.id)
      .single()

    if (profileData) {
      await supabase
        .from('profiles')
        .update({ posts_count: (profileData.posts_count ?? 0) + 1 })
        .eq('id', user.id)
    }
  } catch {
    // Non-critical — ignore
  }

  return NextResponse.json({ post }, { status: 201 })
}
