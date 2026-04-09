import type { ClientBlock } from 'payload'

import React from 'react'

/**
 * Get the appropriate icon component for a block in Lexical editor menus/toolbars.
 *
 * Priority for URL: images.icon > images.thumbnail > imageURL (deprecated)
 * Priority for alt: images.icon.alt > images.thumbnail.alt > imageAltText (deprecated)
 */
export function getBlockImageComponent(block: ClientBlock, fallback: React.ElementType) {
  const { admin, imageAltText, imageURL } = block
  const images = admin?.images

  let displayURL: string | undefined
  let displayAlt: string | undefined

  if (images?.icon) {
    displayURL = typeof images.icon === 'string' ? images.icon : images.icon.url
    displayAlt = typeof images.icon === 'string' ? undefined : images.icon.alt
  } else if (images?.thumbnail) {
    displayURL = typeof images.thumbnail === 'string' ? images.thumbnail : images.thumbnail.url
    displayAlt = typeof images.thumbnail === 'string' ? undefined : images.thumbnail.alt
  } else {
    // Deprecated fallback
    displayURL = imageURL
    displayAlt = imageAltText
  }

  if (!displayURL) {
    return fallback
  }

  const alt = displayAlt ?? 'Block Image'

  return () => (
    <img
      alt={alt}
      className="lexical-block-custom-image"
      src={displayURL}
      style={{ maxHeight: 20, maxWidth: 20 }}
    />
  )
}
