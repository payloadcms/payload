import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.js'

import { StrikethroughIcon } from '../../icons/Strikethrough/index.js'
import { LeafButton } from '../Button.js'
import { Strikethrough } from './Strikethrough/index.js'

export const strikethrough: RichTextCustomLeaf = {
  name: 'strikethrough',
  Button: () => (
    <LeafButton format="strikethrough">
      <StrikethroughIcon />
    </LeafButton>
  ),
  Leaf: Strikethrough,
}
