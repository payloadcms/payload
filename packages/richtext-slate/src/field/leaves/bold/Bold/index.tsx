'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider'

export const Bold = () => {
  const { attributes, children } = useLeaf()
  return <strong {...attributes}>{children}</strong>
}
