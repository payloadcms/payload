import React from 'react'

import type { RichTextCustomLeaf } from '../../../types.d.ts'

import ItalicIcon from '../../icons/Italic/index.js'
import LeafButton from '../Button.js'
import { Italic } from './Italic/index.js'

const italic: RichTextCustomLeaf = {
  name: 'italic',
  Button: () => (
    <LeafButton format="italic">
      <ItalicIcon />
    </LeafButton>
  ),
  Leaf: Italic,
}

export default italic
