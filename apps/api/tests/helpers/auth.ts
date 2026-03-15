import { createServer, type Server } from 'node:http'
import { generateKeyPair, exportJWK, SignJWT } from 'jose'

const ROLES_CLAIM = 'https://mykb.bryanlam.dev/roles'
const TEST_AUDIENCE = 'https://mykb.bryanlam.dev/api'
const TEST_ISSUER = 'http://localhost:3999/'

let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey']
let publicJwk: Record<string, unknown>
let jwksServer: Server | null = null

export async function initTestKeys() {
  const { privateKey: priv, publicKey: pub } = await generateKeyPair('RS256')
  privateKey = priv
  const jwk = await exportJWK(pub)
  publicJwk = { ...jwk, kid: 'test-key-1', use: 'sig', alg: 'RS256' }
}

export async function startJwksServer(port = 3999): Promise<Server> {
  await initTestKeys()

  return new Promise((resolve, reject) => {
    jwksServer = createServer((req, res) => {
      if (req.url === '/.well-known/jwks.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ keys: [publicJwk] }))
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    jwksServer.on('error', (err) => reject(err))
    jwksServer.listen(port, () => resolve(jwksServer!))
  })
}

export async function stopJwksServer() {
  if (jwksServer) {
    await new Promise<void>((resolve) => jwksServer!.close(() => resolve()))
    jwksServer = null
  }
}

interface TokenOptions {
  readonly sub?: string
  readonly email?: string
  readonly name?: string
  readonly picture?: string
  readonly roles?: string[]
  readonly expiresIn?: string
}

export async function createTestToken(options: TokenOptions = {}): Promise<string> {
  const {
    sub = 'auth0|test-user-123',
    email = 'test@example.com',
    name = 'Test User',
    picture = 'https://example.com/avatar.png',
    roles = ['viewer'],
    expiresIn = '1h',
  } = options

  let builder = new SignJWT({
    email,
    name,
    picture,
    [ROLES_CLAIM]: roles,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
    .setSubject(sub)
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_AUDIENCE)
    .setIssuedAt()

  if (expiresIn) {
    builder = builder.setExpirationTime(expiresIn)
  }

  return builder.sign(privateKey)
}
