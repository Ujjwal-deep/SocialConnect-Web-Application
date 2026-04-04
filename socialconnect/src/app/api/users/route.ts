import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('username', { ascending: true })

    if (error) {
       return NextResponse.json({ error: error.message, status: 500 }, { status: 500 })
    }

    return NextResponse.json(profiles)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
