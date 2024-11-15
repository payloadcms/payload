'use client'
import React from 'react'

import { useBlockComponentContext } from '../BlockContent.js'

export const BlockCollapsible: React.FC<{
  children?: React.ReactNode
  Label?: React.ReactNode
}> = ({ children, Label }) => {
  const { BlockCollapsible } = useBlockComponentContext()

  return BlockCollapsible ? <BlockCollapsible Label={Label}>{children}</BlockCollapsible> : null
}
