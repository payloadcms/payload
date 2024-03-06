'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider.js'

export const Code = () => {
  const { attributes, children } = useLeaf()
  return <code {...attributes}>{children}</code>
}
