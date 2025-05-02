'use client'
import React from 'react'

import { useBlockComponentContext } from '../BlockContent.js'

export const BlockRemoveButton = () => {
  const { RemoveButton } = useBlockComponentContext()

  return RemoveButton ? <RemoveButton /> : null
}
