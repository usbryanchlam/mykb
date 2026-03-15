import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

export async function proxy(request: Request) {
  const url = new URL(request.url)

  const authResponse = await auth0.middleware(request)

  if (url.pathname.startsWith('/dashboard')) {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return authResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
