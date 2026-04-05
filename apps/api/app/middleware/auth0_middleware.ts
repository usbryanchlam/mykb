import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import env from '#start/env'
import User from '#models/user'
import { DateTime } from 'luxon'
import type { UserRole } from '@mykb/shared'

const ROLES_CLAIM = 'https://mykb.bryanlam.dev/roles'

const jwks = createRemoteJWKSet(
  new URL(`${env.get('AUTH0_ISSUER_BASE_URL')}/.well-known/jwks.json`)
)

export default class Auth0Middleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.response.unauthorized({
        success: false,
        data: null,
        error: 'Missing or invalid authorization header',
      })
    }

    const token = authHeader.slice(7)

    let payload: JWTPayload
    try {
      const result = await jwtVerify(token, jwks, {
        issuer: `${env.get('AUTH0_ISSUER_BASE_URL')}/`,
        audience: env.get('AUTH0_AUDIENCE'),
      })
      payload = result.payload
    } catch {
      return ctx.response.unauthorized({
        success: false,
        data: null,
        error: 'Invalid or expired token',
      })
    }

    const auth0Sub = payload.sub!
    const email = (payload['email'] as string | undefined) ?? null
    const name = (payload['name'] as string | undefined) ?? ''
    const picture = (payload['picture'] as string | undefined) ?? null
    const roles = (payload[ROLES_CLAIM] as string[] | undefined) ?? []
    const role = (roles[0] ?? 'viewer') as UserRole

    const user = await User.updateOrCreate(
      { auth0Sub },
      {
        email,
        name,
        avatarUrl: picture,
        role,
        lastLoginAt: DateTime.now(),
      }
    )

    ctx.auth0User = user

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth0User: User
  }
}
