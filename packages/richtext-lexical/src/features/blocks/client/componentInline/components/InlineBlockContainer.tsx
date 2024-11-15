'use client'
import React from 'react'

import { useBlockComponentContext } from '../index.js'

export const InlineBlockContainer = ({ children }) => {
  const { InlineBlockContainer } = useBlockComponentContext()

  return InlineBlockContainer ? <InlineBlockContainer>{children}</InlineBlockContainer> : null
}
