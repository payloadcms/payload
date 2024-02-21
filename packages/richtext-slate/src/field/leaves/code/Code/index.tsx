'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider'

export const Code = () => {
  const { attributes, children } = useLeaf()
  return <code {...attributes}>{children}</code>
}
