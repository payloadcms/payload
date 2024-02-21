'use client'
import React from 'react'

import type { RichTextCustomLeaf } from '../../..'

import StrikethroughIcon from '../../icons/Strikethrough'
import { useLeaf } from '../../providers/LeafProvider'
import LeafButton from '../Button'

const Strikethrough = () => {
  const { attributes, children } = useLeaf()
  return <del {...attributes}>{children}</del>
}

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
