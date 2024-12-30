'use client'
import React from 'react'

import { useInlineBlockComponentContext } from '../index.js'

export const InlineBlockEditButton = () => {
  const { EditButton } = useInlineBlockComponentContext()

  return EditButton ? <EditButton /> : null
}
