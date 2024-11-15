'use client'
import React from 'react'

import { useBlockComponentContext } from '../index.js'

export const InlineBlockRemoveButton = () => {
  const { RemoveButton } = useBlockComponentContext()

  return RemoveButton ? <RemoveButton /> : null
}
