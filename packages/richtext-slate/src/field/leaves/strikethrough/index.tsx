import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import StrikethroughIcon from '../../icons/Strikethrough'
import LeafButton from '../Button'
import { Strikethrough } from './Strikethrough'

const strikethrough: RichTextCustomLeaf = {
  name: 'strikethrough',
  Button: () => (
    <LeafButton format="strikethrough">
      <StrikethroughIcon />
    </LeafButton>
  ),
  Leaf: Strikethrough,
}

export default strikethrough
