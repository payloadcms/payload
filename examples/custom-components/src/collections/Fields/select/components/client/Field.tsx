'use client'
import type { SelectFieldClientProps } from 'payload'

import { SelectField } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldClient: React.FC<SelectFieldClientProps> = (props) => {
  return <SelectField {...props} />
}
