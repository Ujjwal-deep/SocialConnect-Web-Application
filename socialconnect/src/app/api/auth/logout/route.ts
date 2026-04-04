import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      return NextResponse.json(
        { error: signOutError.message, status: signOutError.status || 500 },
        { status: signOutError.status || 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', status: 500 },
      { status: 500 }
    )
  }
}
