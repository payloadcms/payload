'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider.js'

export const Bold = () => {
  const { attributes, children } = useLeaf()
  return <strong {...attributes}>{children}</strong>
}
