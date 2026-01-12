'use client'
import React from 'react'

import { type BlockCollapsibleProps, useBlockComponentContext } from '../BlockContent.js'

export const BlockCollapsible: React.FC<BlockCollapsibleProps> = (props) => {
  const { children, ...rest } = props
  const { BlockCollapsible } = useBlockComponentContext()

  return BlockCollapsible ? <BlockCollapsible {...rest}>{children}</BlockCollapsible> : null
}
