import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message, status: 500 }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', status: 401 }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''
    let updateData: Record<string, string | null> = {}
    let avatarUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Extract text fields
      const bio = formData.get('bio') as string | null
      const website = formData.get('website') as string | null
      const location = formData.get('location') as string | null
      const firstName = formData.get('first_name') as string | null
      const lastName = formData.get('last_name') as string | null

      if (bio !== null) {
        if (bio.length > 160) {
          return NextResponse.json({ error: 'Bio must be 160 characters or less', status: 400 }, { status: 400 })
        }
        updateData.bio = bio
      }
      if (website !== null) updateData.website = website
      if (location !== null) updateData.location = location
      if (firstName !== null) updateData.first_name = firstName
      if (lastName !== null) updateData.last_name = lastName

      // Handle avatar file
      const avatarFile = formData.get('avatar') as File | null
      if (avatarFile && avatarFile.size > 0) {
        if (!ALLOWED_TYPES.includes(avatarFile.type)) {
          return NextResponse.json({ error: 'Avatar must be JPEG or PNG', status: 400 }, { status: 400 })
        }
        if (avatarFile.size > MAX_AVATAR_SIZE) {
          return NextResponse.json({ error: 'Avatar must be under 2MB', status: 400 }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const ext = avatarFile.type === 'image/png' ? 'png' : 'jpg'
        const path = `${user.id}/avatar.${ext}`
        const bytes = await avatarFile.arrayBuffer()

        const { error: uploadError } = await adminClient.storage
          .from('avatars')
          .upload(path, bytes, {
            contentType: avatarFile.type,
            upsert: true,
          })

        if (uploadError) {
          return NextResponse.json({ error: `Avatar upload failed: ${uploadError.message}`, status: 500 }, { status: 500 })
        }

        const { data: urlData } = adminClient.storage.from('avatars').getPublicUrl(path)
        // Add cache-busting timestamp so browsers reload new avatar
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
        updateData.avatar_url = avatarUrl
      }
    } else {
      // JSON body
      const body = await request.json()
      const { bio, website, location, first_name, last_name } = body

      if (bio !== undefined) {
        if (typeof bio === 'string' && bio.length > 160) {
          return NextResponse.json({ error: 'Bio must be 160 characters or less', status: 400 }, { status: 400 })
        }
        updateData.bio = bio
      }
      if (website !== undefined) updateData.website = website
      if (location !== undefined) updateData.location = location
      if (first_name !== undefined) updateData.first_name = first_name
      if (last_name !== undefined) updateData.last_name = last_name
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update', status: 400 }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message, status: 500 }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}

export { PATCH as PUT }
