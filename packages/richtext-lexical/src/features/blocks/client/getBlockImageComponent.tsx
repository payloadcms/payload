import React from 'react'

import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js'

export function getBlockImageComponent(imageURL?: string, imageAltText?: string) {
  if (!imageURL) {
    return BlockIcon
  }

  return () => <img alt={imageAltText ?? 'Block Image'} src={imageURL} />
}
