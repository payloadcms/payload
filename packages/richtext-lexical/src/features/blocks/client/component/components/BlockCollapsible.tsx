'use client'
import React from 'react'

import { useBlockComponentContext } from '../BlockContent.js'

export const BlockCollapsible: React.FC<{
  children?: React.ReactNode
  editButton?: boolean

  /**
   * Override the default label with a custom label
   */
  Label?: React.ReactNode
  removeButton?: boolean
}> = ({ children, editButton, Label, removeButton }) => {
  const { BlockCollapsible } = useBlockComponentContext()

  return BlockCollapsible ? (
    <BlockCollapsible editButton={editButton} Label={Label} removeButton={removeButton}>
      {children}
    </BlockCollapsible>
  ) : null
}
