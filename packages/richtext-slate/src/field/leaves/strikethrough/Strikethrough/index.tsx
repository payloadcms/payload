'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider.js'

export const StrikethroughLeaf = () => {
  const { attributes, children } = useLeaf()
  return <del {...attributes}>{children}</del>
}
