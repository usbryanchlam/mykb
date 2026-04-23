import { createHmac, createHash } from 'node:crypto'
import env from '#start/env'

/**
 * Resolves a storage key to a public URL without instantiating StorageService.
 * Returns null if storage is not configured or the key is null.
 */
export function resolvePublicUrl(key: string | null): string | null {
  if (!key) return null
  const namespace = env.get('OCI_OBJECT_STORAGE_NAMESPACE')
  const bucket = env.get('OCI_OBJECT_STORAGE_BUCKET')
  const region = env.get('OCI_REGION') ?? 'us-ashburn-1'
  if (!namespace || !bucket) return null
  return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucket}/o/${encodeURIComponent(key)}`
}

interface StorageConfig {
  readonly namespace: string
  readonly bucket: string
  readonly accessKey: string
  readonly secretKey: string
  readonly region: string
}

function getConfig(): StorageConfig | null {
  const namespace = env.get('OCI_OBJECT_STORAGE_NAMESPACE')
  const bucket = env.get('OCI_OBJECT_STORAGE_BUCKET')
  const accessKey = env.get('OCI_ACCESS_KEY')
  const secretKey = env.get('OCI_SECRET_KEY')
  const region = env.get('OCI_REGION') ?? 'us-ashburn-1'

  if (!namespace || !bucket || !accessKey || !secretKey) {
    return null
  }

  return { namespace, bucket, accessKey, secretKey, region }
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest()
}

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

function getSigningKey(secretKey: string, dateStamp: string, region: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, 's3')
  return hmacSha256(kService, 'aws4_request')
}

export default class StorageService {
  private readonly config: StorageConfig | null

  constructor() {
    this.config = getConfig()
  }

  get isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Upload a file to OCI Object Storage.
   * Returns the object key on success.
   */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    const config = this.requireConfig()
    const host = `${config.namespace}.compat.objectstorage.${config.region}.oraclecloud.com`
    const path = `/${config.bucket}/${key}`
    const url = `https://${host}${path}`

    const bodyHash = sha256Hex(body)
    const now = new Date()
    const amzDate = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z$/, 'Z')
    const dateStamp = amzDate.slice(0, 8)

    const headers: Record<string, string> = {
      'Host': host,
      'Content-Type': contentType,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
    }

    const authorization = this.signRequest(
      'PUT',
      path,
      headers,
      bodyHash,
      dateStamp,
      amzDate,
      config
    )
    headers['Authorization'] = authorization

    const response = await fetch(url, {
      method: 'PUT',
      signal: AbortSignal.timeout(30_000),
      headers,
      body,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Storage upload failed: HTTP ${response.status} — ${text.slice(0, 200)}`)
    }

    return key
  }

  /**
   * Download a file from OCI Object Storage.
   * Returns the file contents as a Buffer.
   */
  async download(key: string): Promise<Buffer> {
    const config = this.requireConfig()
    const host = `${config.namespace}.compat.objectstorage.${config.region}.oraclecloud.com`
    const path = `/${config.bucket}/${key}`
    const url = `https://${host}${path}`

    const bodyHash = sha256Hex('')
    const now = new Date()
    const amzDate = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z$/, 'Z')
    const dateStamp = amzDate.slice(0, 8)

    const headers: Record<string, string> = {
      'Host': host,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
    }

    const authorization = this.signRequest(
      'GET',
      path,
      headers,
      bodyHash,
      dateStamp,
      amzDate,
      config
    )
    headers['Authorization'] = authorization

    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(30_000),
      headers,
    })

    if (!response.ok) {
      throw new Error(`Storage download failed: HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Delete a file from OCI Object Storage.
   */
  async delete(key: string): Promise<void> {
    const config = this.requireConfig()
    const host = `${config.namespace}.compat.objectstorage.${config.region}.oraclecloud.com`
    const path = `/${config.bucket}/${key}`
    const url = `https://${host}${path}`

    const bodyHash = sha256Hex('')
    const now = new Date()
    const amzDate = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z$/, 'Z')
    const dateStamp = amzDate.slice(0, 8)

    const headers: Record<string, string> = {
      'Host': host,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
    }

    const authorization = this.signRequest(
      'DELETE',
      path,
      headers,
      bodyHash,
      dateStamp,
      amzDate,
      config
    )
    headers['Authorization'] = authorization

    const response = await fetch(url, {
      method: 'DELETE',
      signal: AbortSignal.timeout(30_000),
      headers,
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`Storage delete failed: HTTP ${response.status}`)
    }
  }

  /**
   * Generate the public URL for an object (unsigned — bucket must allow public reads,
   * or use pre-authenticated requests for private buckets).
   */
  getPublicUrl(key: string): string | null {
    const config = this.config
    if (!config) return null

    return `https://objectstorage.${config.region}.oraclecloud.com/n/${config.namespace}/b/${config.bucket}/o/${encodeURIComponent(key)}`
  }

  private requireConfig(): StorageConfig {
    if (!this.config) {
      throw new Error('OCI Object Storage is not configured')
    }
    return this.config
  }

  private signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    bodyHash: string,
    dateStamp: string,
    amzDate: string,
    config: StorageConfig
  ): string {
    const signedHeaderKeys = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
    const signedHeaders = signedHeaderKeys.join(';')

    const canonicalHeaderLines = Object.entries(headers)
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
      .sort()
      .join('\n')

    const canonicalRequest = [
      method,
      path,
      '', // query string (empty)
      canonicalHeaderLines + '\n',
      signedHeaders,
      bodyHash,
    ].join('\n')

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n')

    const signingKey = getSigningKey(config.secretKey, dateStamp, config.region)
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

    return `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  }
}
