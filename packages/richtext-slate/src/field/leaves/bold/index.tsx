import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.d.ts'

import { BoldIcon } from '../../icons/Bold/index.js'
import { LeafButton } from '../Button.js'
import { Bold } from './Bold/index.js'

export const bold: RichTextCustomLeaf = {
  name: 'bold',
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
}
