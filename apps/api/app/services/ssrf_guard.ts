import { resolve4, resolve6 } from 'node:dns/promises'

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
  if (lower === '::') return true
  if (lower.startsWith('fe80:')) return true

  // RFC 4193: fc00::/7 — covers fc00::/8 and fd00::/8 (unique local)
  const firstHextet = Number.parseInt(lower.split(':')[0] || '0', 16)
  if ((firstHextet & 0xfe00) === 0xfc00) return true

  return false
}

/**
 * Resolves all IP addresses for a hostname and validates none are private.
 * Uses resolve4/resolve6 to get ALL addresses (not just one like dns.lookup).
 * Returns the list of resolved addresses so the caller can pin to them.
 */
async function resolveAndValidate(hostname: string): Promise<readonly string[]> {
  // If hostname is already an IP literal, validate directly
  if (isPrivateIp(hostname)) {
    throw new Error(`Blocked private IP: ${hostname}`)
  }

  const [v4Result, v6Result] = await Promise.allSettled([resolve4(hostname), resolve6(hostname)])

  const allAddresses = [
    ...(v4Result.status === 'fulfilled' ? v4Result.value : []),
    ...(v6Result.status === 'fulfilled' ? v6Result.value : []),
  ]

  if (allAddresses.length === 0) {
    throw new Error(`DNS resolution failed for ${hostname}`)
  }

  const blockedAddress = allAddresses.find(isPrivateIp)
  if (blockedAddress) {
    throw new Error(`Blocked private IP: hostname ${hostname} resolved to ${blockedAddress}`)
  }

  return allAddresses
}

/**
 * Validates that a URL is safe to fetch (no SSRF).
 * - Only http/https protocols allowed
 * - Resolves ALL IPs for hostname and blocks private/loopback/link-local
 * - Returns resolved IPs so caller can pin connections to them
 */
export async function assertSafeUrl(url: string): Promise<readonly string[]> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked protocol: ${parsed.protocol}`)
  }

  return resolveAndValidate(parsed.hostname)
}

export { isPrivateIp }
