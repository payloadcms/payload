import React from 'react'

import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js'

/**
 * Get the appropriate icon component for a block in Lexical editor menus/toolbars.
 * Priority: iconImageURL > imageURL > default BlockIcon
 *
 * @param iconImageURL - Preferred icon image (20x20px, typically square)
 * @param iconImageAltText - Alt text for icon image
 * @param imageURL - Fallback thumbnail image (3:2 aspect ratio)
 * @param imageAltText - Alt text for thumbnail image (used as fallback for iconImageAltText)
 */
export function getBlockImageComponent(
  iconImageURL?: string,
  iconImageAltText?: string,
  imageURL?: string,
  imageAltText?: string,
) {
  // Use iconImageURL if available, otherwise fall back to imageURL
  const displayImageURL = iconImageURL || imageURL

  if (!displayImageURL) {
    return BlockIcon
  }

  // Prefer iconImageAltText, fall back to imageAltText
  const displayAltText = iconImageAltText || imageAltText || 'Block Image'

  return () => (
    <img
      alt={displayAltText}
      className="lexical-block-custom-image"
      src={displayImageURL}
      style={{ maxHeight: 20, maxWidth: 20 }}
    />
  )
}
