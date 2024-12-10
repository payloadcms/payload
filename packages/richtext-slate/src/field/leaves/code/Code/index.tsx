'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider.js'

export const CodeLeaf = () => {
  const { attributes, children } = useLeaf()
  return <code {...attributes}>{children}</code>
}
