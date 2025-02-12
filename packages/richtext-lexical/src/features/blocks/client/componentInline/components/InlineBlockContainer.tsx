'use client'
import React from 'react'

import { useInlineBlockComponentContext } from '../index.js'

export const InlineBlockContainer = ({ children }: { children: React.ReactNode }) => {
  const { InlineBlockContainer } = useInlineBlockComponentContext()

  return InlineBlockContainer ? <InlineBlockContainer>{children}</InlineBlockContainer> : null
}
