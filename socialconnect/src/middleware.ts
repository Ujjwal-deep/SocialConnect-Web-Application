import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 1. If no user and trying to access protected route (anything NOT /login or /register or /api/auth/*)
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register') || url.pathname.startsWith('/api/auth')
  const isStaticFile = url.pathname.includes('.') || url.pathname.startsWith('/_next')

  if (!user && !isAuthRoute && !isStaticFile) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If user exists and trying to access login/register
  if (user && isAuthRoute && !url.pathname.startsWith('/api/auth/logout')) {
     url.pathname = '/feed'
     return NextResponse.redirect(url)
  }

  // 3. Redirect root to feed if logged in
  if (user && url.pathname === '/') {
     url.pathname = '/feed'
     return NextResponse.redirect(url)
  }
  
  if (!user && url.pathname === '/') {
     url.pathname = '/login'
     return NextResponse.redirect(url)
  }

  return response
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
