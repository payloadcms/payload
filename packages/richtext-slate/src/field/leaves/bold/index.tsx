import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import BoldIcon from '../../icons/Bold'
import { useLeaf } from '../../providers/LeafProvider'
import LeafButton from '../Button'

const Bold = () => {
  const { attributes, children } = useLeaf()
  return <strong {...attributes}>{children}</strong>
}

const bold: RichTextCustomLeaf = {
  name: 'bold',
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
}

export default bold
