'use client'
import React from 'react'

import { useInlineBlockComponentContext } from '../index.js'

export const InlineBlockLabel = () => {
  const { Label } = useInlineBlockComponentContext()

  return Label ? <Label /> : null
}
