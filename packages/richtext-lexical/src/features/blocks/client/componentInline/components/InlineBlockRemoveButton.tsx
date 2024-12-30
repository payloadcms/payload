'use client'
import React from 'react'

import { useInlineBlockComponentContext } from '../index.js'

export const InlineBlockRemoveButton = () => {
  const { RemoveButton } = useInlineBlockComponentContext()

  return RemoveButton ? <RemoveButton /> : null
}
