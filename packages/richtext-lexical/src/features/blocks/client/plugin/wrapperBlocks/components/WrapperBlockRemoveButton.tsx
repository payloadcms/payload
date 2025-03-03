'use client'
import React from 'react'

import { useWrapperBlockComponentContext } from '../BlockEditor/index.js'

export const WrapperBlockRemoveButton = () => {
  const { RemoveButton } = useWrapperBlockComponentContext()

  return RemoveButton ? <RemoveButton /> : null
}
