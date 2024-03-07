import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.d.ts'

import { UnderlineIcon } from '../../icons/Underline/index.js'
import { LeafButton } from '../Button.js'
import { Underline } from './Underline/index.js'

export const underline: RichTextCustomLeaf = {
  name: 'underline',
  Button: () => (
    <LeafButton format="underline">
      <UnderlineIcon />
    </LeafButton>
  ),
  Leaf: Underline,
}
