import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import UnderlineIcon from '../../icons/Underline'
import { useLeaf } from '../../providers/LeafProvider'
import LeafButton from '../Button'

const Underline = () => {
  const { attributes, children } = useLeaf()
  return <u {...attributes}>{children}</u>
}

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
