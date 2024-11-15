'use client'
import React from 'react'

import { useInlineBlockComponentContext } from '../index.js'

export const InlineBlockContainer = ({ children }) => {
  const { InlineBlockContainer } = useInlineBlockComponentContext()

  return InlineBlockContainer ? <InlineBlockContainer>{children}</InlineBlockContainer> : null
}
