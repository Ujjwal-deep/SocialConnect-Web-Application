import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.user_id)
      .single()

    if (error) {
       return NextResponse.json({ error: error.message, status: 404 }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', status: 500 }, { status: 500 })
  }
}
