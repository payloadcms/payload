'use client'
import type { NumberFieldClientProps } from 'payload'

import { NumberField } from '@payloadcms/ui'
import React from 'react'

export const CustomNumberFieldClient: React.FC<NumberFieldClientProps> = (props) => {
  return <NumberField {...props} />
}
