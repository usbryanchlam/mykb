import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'

const ROLES_CLAIM = 'https://mykb.bryanlam.dev/roles'

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return {}
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return {}
  }
}

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
  async onCallback(error, ctx) {
    if (error) {
      const SAFE_CODES = new Set(['access_denied', 'unauthorized', 'login_required'])
      const safeCode = SAFE_CODES.has(error.code ?? '') ? error.code! : 'unknown'
      const url = new URL('/auth-error', ctx.appBaseUrl)
      url.searchParams.set('error', safeCode)
      return NextResponse.redirect(url)
    }
    return NextResponse.redirect(new URL(ctx.returnTo ?? '/', ctx.appBaseUrl))
  },
  async beforeSessionSaved(session, idToken) {
    const claims = idToken ? decodeJwtPayload(idToken) : {}
    const roles = (claims[ROLES_CLAIM] as string[] | undefined) ?? []

    return {
      ...session,
      user: {
        ...session.user,
        [ROLES_CLAIM]: roles,
      },
    }
  },
})
