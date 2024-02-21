import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import ItalicIcon from '../../icons/Italic'
import { useLeaf } from '../../providers/LeafProvider'
import LeafButton from '../Button'

const Italic = () => {
  const { attributes, children } = useLeaf()
  return <em {...attributes}>{children}</em>
}

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
