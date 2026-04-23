'use client'

import { useState } from 'react'
import { isSafeImageUrl } from '@/lib/bookmark-utils'

interface BookmarkThumbnailProps {
  readonly thumbnailUrl: string | null
  readonly ogImageUrl: string | null
  readonly alt: string
  readonly className?: string
}

export function BookmarkThumbnail({
  thumbnailUrl,
  ogImageUrl,
  alt,
  className,
}: BookmarkThumbnailProps) {
  const [hidden, setHidden] = useState(false)

  const imageUrl = isSafeImageUrl(thumbnailUrl)
    ? thumbnailUrl
    : isSafeImageUrl(ogImageUrl)
      ? ogImageUrl
      : null

  if (!imageUrl || hidden) return null

  return (
    <div className={`aspect-video w-full overflow-hidden ${className ?? ''}`}>
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        className="size-full object-cover"
        onError={() => setHidden(true)}
      />
    </div>
  )
}
