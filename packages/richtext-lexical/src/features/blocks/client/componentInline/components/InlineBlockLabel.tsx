'use client'
import React from 'react'

import { useBlockComponentContext } from '../index.js'

export const InlineBlockLabel = () => {
  const { Label } = useBlockComponentContext()

  return Label ? <Label /> : null
}
