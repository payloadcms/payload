'use client'
import type { ArrayFieldClientProps } from 'payload'

import { ArrayField } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldClient: React.FC<ArrayFieldClientProps> = (props) => {
  return <ArrayField {...props} />
}
