'use client'
import type { BlocksFieldClientProps } from 'payload'

import { BlocksField } from '@payloadcms/ui'
import React from 'react'

export const CustomBlocksFieldClient: React.FC<BlocksFieldClientProps> = (props) => {
  return <BlocksField {...props} />
}
