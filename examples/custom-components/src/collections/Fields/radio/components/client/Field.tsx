'use client'
import type { RadioFieldClientProps } from 'payload'

import { RadioGroupField } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldClient: React.FC<RadioFieldClientProps> = (props) => {
  return <RadioGroupField {...props} />
}
