import { load as cheerioLoad } from 'cheerio'
import { Readability } from '@mozilla/readability'
import DOMPurify from 'isomorphic-dompurify'
import { parseHTML } from 'linkedom'
import { assertSafeUrl } from '#services/ssrf_guard'

const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_REDIRECTS = 3

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'em',
    'strong',
    'a',
    'img',
    'br',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'figure',
    'figcaption',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
  ALLOWED_URI_REGEXP: /^https:\/\//i,
  ALLOW_DATA_ATTR: false,
} as const

export interface ScrapeResult {
  readonly title: string | null
  readonly description: string | null
  readonly faviconUrl: string | null
  readonly ogImageUrl: string | null
  readonly content: string | null
  readonly plainText: string | null
}

interface ExtractedMetadata {
  readonly title: string | null
  readonly description: string | null
  readonly faviconUrl: string | null
  readonly ogImageUrl: string | null
}

export default class ScraperService {
  async scrape(url: string): Promise<ScrapeResult> {
    await assertSafeUrl(url)

    const html = await this.fetchHtml(url)
    const metadata = this.extractMetadata(html, url)
    const article = this.extractArticle(html)

    return {
      title: metadata.title,
      description: metadata.description,
      faviconUrl: metadata.faviconUrl,
      ogImageUrl: metadata.ogImageUrl,
      content: article?.content ?? null,
      plainText: article?.plainText ?? null,
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    let currentUrl = url
    let redirectCount = 0

    while (redirectCount <= MAX_REDIRECTS) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const response = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'MyKB/1.0 (+https://mykb.bryanlam.dev)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        })

        // Handle redirects manually to count them
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location')
          if (!location) throw new Error('Redirect without Location header')

          currentUrl = new URL(location, currentUrl).href
          await assertSafeUrl(currentUrl)
          redirectCount++
          continue
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          throw new Error(`Unsupported content type: ${contentType}`)
        }

        const contentLength = response.headers.get('content-length')
        if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_BYTES) {
          throw new Error(`Response too large: ${contentLength} bytes`)
        }

        return await this.readBodyWithLimit(response)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms`)
        }
        throw error
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`)
  }

  private async readBodyWithLimit(response: Response): Promise<string> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        totalBytes += value.byteLength
        if (totalBytes > MAX_BODY_BYTES) {
          await reader.cancel()
          throw new Error(`Response body exceeds ${MAX_BODY_BYTES} bytes`)
        }

        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    const decoder = new TextDecoder()
    return (
      chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') + decoder.decode()
    )
  }

  private extractMetadata(html: string, baseUrl: string): ExtractedMetadata {
    const $ = cheerioLoad(html)

    const rawTitle =
      $('meta[property="og:title"]').attr('content') ??
      $('meta[name="twitter:title"]').attr('content') ??
      $('title').text().trim()
    const title = rawTitle || null

    const description =
      $('meta[property="og:description"]').attr('content') ??
      $('meta[name="description"]').attr('content') ??
      $('meta[name="twitter:description"]').attr('content') ??
      null

    const ogImageUrl =
      $('meta[property="og:image"]').attr('content') ??
      $('meta[name="twitter:image"]').attr('content') ??
      null

    const faviconHref =
      $('link[rel="icon"]').attr('href') ?? $('link[rel="shortcut icon"]').attr('href') ?? null

    // Only store https:// URLs for favicon/og to prevent SSRF when fetched later
    const faviconUrl = faviconHref ? this.resolveSafeImageUrl(faviconHref, baseUrl) : null
    const resolvedOgImage = ogImageUrl ? this.resolveSafeImageUrl(ogImageUrl, baseUrl) : null

    return {
      title: title || null,
      description: description || null,
      faviconUrl,
      ogImageUrl: resolvedOgImage,
    }
  }

  private extractArticle(html: string): { content: string; plainText: string } | null {
    try {
      const { document } = parseHTML(html)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reader = new Readability(document as any)
      const article = reader.parse()

      if (!article) return null

      return {
        content: DOMPurify.sanitize(article.content ?? '', SANITIZE_CONFIG),
        plainText: (article.textContent ?? '').trim(),
      }
    } catch {
      return null
    }
  }

  /**
   * Resolves a relative URL and validates it uses https only.
   * Prevents storing private-network URLs that could be used for SSRF
   * if the frontend or backend later fetches the image.
   */
  private resolveSafeImageUrl(href: string, baseUrl: string): string | null {
    try {
      const resolved = new URL(href, baseUrl)
      return resolved.protocol === 'https:' ? resolved.href : null
    } catch {
      return null
    }
  }
}
