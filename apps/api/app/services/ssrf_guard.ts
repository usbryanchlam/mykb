import { lookup } from 'node:dns/promises'

function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  if (ip.startsWith('127.')) return true
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true
  if (ip === '0.0.0.0') return true

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const second = Number.parseInt(ip.split('.')[1], 10)
    if (second >= 16 && second <= 31) return true
  }

  // IPv6 checks
  const lower = ip.toLowerCase()
  if (lower === '::1') return true
  if (lower.startsWith('fe80:')) return true
  if (lower.startsWith('fc00:') || lower.startsWith('fd')) return true
  if (lower === '::') return true

  return false
}

/**
 * Validates that a URL is safe to fetch (no SSRF).
 * - Only http/https protocols allowed
 * - Resolves hostname to IP and blocks private/loopback/link-local addresses
 */
export async function assertSafeUrl(url: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked protocol: ${parsed.protocol}`)
  }

  // Block direct IP addresses that are private
  const hostname = parsed.hostname
  if (isPrivateIp(hostname)) {
    throw new Error(`Blocked private IP: ${hostname}`)
  }

  // Resolve hostname to IP and check
  try {
    const { address } = await lookup(hostname)
    if (isPrivateIp(address)) {
      throw new Error(`Blocked private IP: hostname ${hostname} resolved to ${address}`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Blocked')) {
      throw error
    }
    throw new Error(`DNS resolution failed for ${hostname}`)
  }
}

export { isPrivateIp }
