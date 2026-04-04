import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { login, password } = body

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Login and password are required', status: 400 },
        { status: 400 }
      )
    }

    const supabase = createClient()
    let email = login

    // 1. If login is not an email, lookup email by username
    if (!login.includes('@')) {
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', login)
        .maybeSingle()

      if (!profile) {
        return NextResponse.json(
          { error: 'Username not found', status: 404 },
          { status: 404 }
        )
      }
      email = profile.email
    }

    // 2. Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: signInError.message, status: signInError.status || 401 },
        { status: signInError.status || 401 }
      )
    }

    if (!authData.user) {
        return NextResponse.json(
          { error: 'Authentication failed', status: 401 },
          { status: 401 }
        )
    }

    // 3. Update last_login in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)
      .select()
      .single()

    return NextResponse.json({
      access_token: authData.session?.access_token,
      user: profile || authData.user,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', status: 500 },
      { status: 500 }
    )
  }
}
