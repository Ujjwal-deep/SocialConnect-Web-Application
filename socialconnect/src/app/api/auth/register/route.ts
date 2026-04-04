import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message, status: 400 },
        { status: 400 }
      )
    }

    const { email, username, password, first_name, last_name } = result.data
    const supabase = createClient()

    // 1. Check if username is already taken in profiles table
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken', status: 400 },
        { status: 400 }
      )
    }

    // 2. Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name,
          last_name,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message, status: signUpError.status || 500 },
        { status: signUpError.status || 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account', status: 500 },
        { status: 500 }
      )
    }

    // 3. Fallback: Manually ensure profile exists (in case trigger fails)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
          first_name,
          last_name,
        })
        .select()
        .single()

      if (insertError) {
         // If trigger already handled it, this might fail with conflict, which is fine
         if (insertError.code !== '23505') { 
            return NextResponse.json(
                { error: 'Account created but profile failed: ' + insertError.message, status: 500 },
                { status: 500 }
            )
         }
      }
      
      const finalProfile = newProfile || (await supabase.from('profiles').select('*').eq('id', authData.user.id).single()).data

      return NextResponse.json({
        user: finalProfile,
        session: authData.session,
      })
    }

    return NextResponse.json({
      user: profile,
      session: authData.session,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', status: 500 },
      { status: 500 }
    )
  }
}
