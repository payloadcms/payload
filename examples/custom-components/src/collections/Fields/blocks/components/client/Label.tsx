'use client'
import type { BlocksFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldLabelClient: BlocksFieldLabelClientComponent = ({ field }) => {
  return <FieldLabel field={field} />
}
