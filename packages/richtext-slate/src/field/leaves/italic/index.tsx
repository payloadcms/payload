import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import ItalicIcon from '../../icons/Italic'
import LeafButton from '../Button'
import { Italic } from './Italic'

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
