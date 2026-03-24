import { auth0 } from '@/lib/auth0'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  let accessToken: string | undefined
  try {
    const result = await auth0.getAccessToken()
    // @auth0/nextjs-auth0 v4 returns { token: string }, not a bare string
    accessToken = typeof result === 'string' ? result : result?.token
  } catch {
    // Not authenticated — request will proceed without token
  }

  const headers = new Headers(init?.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  headers.set('Content-Type', 'application/json')

  return fetch(`${process.env.API_URL ?? 'http://localhost:3333'}${path}`, {
    ...init,
    headers,
  })
}
