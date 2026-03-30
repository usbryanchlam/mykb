import { Auth0Client } from '@auth0/nextjs-auth0/server'

const ROLES_CLAIM = 'https://mykb.bryanlam.dev/roles'

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split('.')
  if (parts.length !== 3) return {}
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
  return JSON.parse(payload) as Record<string, unknown>
}

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
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
