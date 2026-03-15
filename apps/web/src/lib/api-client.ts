import { auth0 } from '@/lib/auth0'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await auth0.getAccessToken()

  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')

  return fetch(`${process.env.API_URL ?? 'http://localhost:3333'}${path}`, {
    ...init,
    headers,
  })
}
