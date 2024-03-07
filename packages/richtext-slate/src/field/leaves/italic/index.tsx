import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.d.ts'

import { ItalicIcon } from '../../icons/Italic/index.js'
import { LeafButton } from '../Button.js'
import { Italic } from './Italic/index.js'

export const italic: RichTextCustomLeaf = {
  name: 'italic',
  Button: () => (
    <LeafButton format="italic">
      <ItalicIcon />
    </LeafButton>
  ),
  Leaf: Italic,
}
