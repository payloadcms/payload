'use client'
import React from 'react'

import { useBlockComponentContext } from '../index.js'

export const InlineBlockEditButton = () => {
  const { EditButton } = useBlockComponentContext()

  return EditButton ? <EditButton /> : null
}
