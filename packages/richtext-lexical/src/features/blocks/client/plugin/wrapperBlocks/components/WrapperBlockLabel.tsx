'use client'
import React from 'react'

import { useWrapperBlockComponentContext } from '../BlockEditor/index.js'

export const WrapperBlockLabel = () => {
  const { Label } = useWrapperBlockComponentContext()

  return Label ? <Label /> : null
}
