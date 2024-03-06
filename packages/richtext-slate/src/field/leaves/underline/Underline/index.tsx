'use client'
import React from 'react'

import { useLeaf } from '../../../providers/LeafProvider.js'

export const Underline = () => {
  const { attributes, children } = useLeaf()
  return <u {...attributes}>{children}</u>
}
