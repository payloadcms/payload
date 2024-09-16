'use client'
import type { BlocksFieldClientComponent } from 'payload'

import { BlocksField } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldClient: BlocksFieldClientComponent = ({ field }) => {
  return <BlocksField field={field} />
}
