'use client'
import React from 'react'

import { useBlockComponentContext } from '../BlockContent.js'

export const BlockLabel: React.FC<{ editButton?: boolean }> = (props) => {
  const { editButton } = props
  const { Label } = useBlockComponentContext()

  return Label ? <Label editButton={editButton} /> : null
}
