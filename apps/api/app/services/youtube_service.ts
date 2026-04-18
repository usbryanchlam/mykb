// youtube-transcript@1.3.0 has broken ESM resolution ("type": "module" but
// "main" points to CJS, no "exports" map). Import the ESM bundle directly.
import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js'
import { SANITIZE_CONFIG } from '#services/sanitize_config'
import DOMPurify from 'isomorphic-dompurify'
import logger from '@adonisjs/core/services/logger'

const OEMBED_URL = 'https://www.youtube.com/oembed'
const MAX_PLAIN_TEXT_WORDS = 10_000
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

// YouTube transcript HTML uses class="timestamp" for styling.
// This extends the shared config with 'class' only for server-generated transcript HTML.
const YOUTUBE_SANITIZE_CONFIG = {
  ...SANITIZE_CONFIG,
  ALLOWED_ATTR: [...SANITIZE_CONFIG.ALLOWED_ATTR, 'class'],
}

interface YouTubeMetadata {
  readonly title: string | null
  readonly author: string | null
  readonly thumbnailUrl: string | null
}

interface YouTubeTranscriptResult {
  readonly title: string | null
  readonly description: string | null
  readonly faviconUrl: string
  readonly ogImageUrl: string | null
  readonly content: string | null
  readonly plainText: string | null
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'm.youtube.com'
    )
  } catch {
    return false
  }
}

export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const raw =
      parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    if (!raw || !VIDEO_ID_RE.test(raw)) return null
    return raw
  } catch {
    return null
  }
}

async function fetchOEmbed(url: string): Promise<YouTubeMetadata> {
  try {
    const res = await fetch(`${OEMBED_URL}?url=${encodeURIComponent(url)}&format=json`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { title: null, author: null, thumbnailUrl: null }

    const data = (await res.json()) as {
      title?: string
      author_name?: string
      thumbnail_url?: string
    }
    return {
      title: data.title ?? null,
      author: data.author_name ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
    }
  } catch (error) {
    logger.warn({ url, error }, 'YouTube oEmbed fetch failed')
    return { title: null, author: null, thumbnailUrl: null }
  }
}

function escapeHtml(raw: string): string {
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatTimestamp(offsetMs: number): string {
  const safeMs = Number.isFinite(offsetMs) && offsetMs >= 0 ? offsetMs : 0
  const totalSeconds = Math.floor(safeMs / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default class YouTubeService {
  async scrape(url: string): Promise<YouTubeTranscriptResult> {
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL: could not extract video ID')
    }

    // Fetch metadata and transcript in parallel
    const [metadata, transcript] = await Promise.allSettled([
      fetchOEmbed(url),
      fetchTranscript(videoId),
    ])

    const meta =
      metadata.status === 'fulfilled'
        ? metadata.value
        : { title: null, author: null, thumbnailUrl: null }

    const description = meta.author ? `YouTube video by ${meta.author}` : null

    // If transcript fetch failed, return metadata only
    if (transcript.status === 'rejected') {
      return {
        title: meta.title,
        description,
        faviconUrl: 'https://www.youtube.com/favicon.ico',
        ogImageUrl: meta.thumbnailUrl,
        content: null,
        plainText: null,
      }
    }

    const segments = transcript.value

    // Build plain text (for AI + search), truncated to MAX_PLAIN_TEXT_WORDS
    const fullText = segments.map((s) => s.text).join(' ')
    const words = fullText.trim().split(/\s+/).filter(Boolean)
    const plainText =
      words.length > MAX_PLAIN_TEXT_WORDS
        ? words.slice(0, MAX_PLAIN_TEXT_WORDS).join(' ')
        : fullText

    // Build timestamped HTML for Reader View
    const htmlSegments = segments.map((s) => {
      const timestamp = formatTimestamp(s.offset)
      return `<p><span class="timestamp">[${timestamp}]</span> ${escapeHtml(s.text)}</p>`
    })
    const rawHtml = htmlSegments.join('\n')
    const content = DOMPurify.sanitize(rawHtml, YOUTUBE_SANITIZE_CONFIG)

    return {
      title: meta.title,
      description,
      faviconUrl: 'https://www.youtube.com/favicon.ico',
      ogImageUrl: meta.thumbnailUrl,
      content,
      plainText,
    }
  }
}
