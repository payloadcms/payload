'use client'
import React from 'react'

import { useWrapperBlockComponentContext } from '../BlockEditor/index.js'

export const WrapperBlockEditButton = () => {
  const { EditButton } = useWrapperBlockComponentContext()

  return EditButton ? <EditButton /> : null
}
