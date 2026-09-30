'use client'
import type { DateFieldClientProps } from 'payload'

import { DateTimeField } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldClient: React.FC<DateFieldClientProps> = (props) => {
  return <DateTimeField {...props} />
}
