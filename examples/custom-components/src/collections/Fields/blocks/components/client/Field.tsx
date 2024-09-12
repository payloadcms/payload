'use client'
import type { BlocksFieldClientComponent } from 'payload'

import { BlocksField } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldClient: BlocksFieldClientComponent = (props) => {
  const { field } = props

  return <BlocksField field={field} />
}
