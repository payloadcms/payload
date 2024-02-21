import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import UnderlineIcon from '../../icons/Underline'
import LeafButton from '../Button'
import { Underline } from './Underline'

const underline: RichTextCustomLeaf = {
  name: 'underline',
  Button: () => (
    <LeafButton format="underline">
      <UnderlineIcon />
    </LeafButton>
  ),
  Leaf: Underline,
}

export default underline
