'use client'
import type { CheckboxFieldClientProps } from 'payload'

import { CheckboxField } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldClient: React.FC<CheckboxFieldClientProps> = (props) => {
  return <CheckboxField {...props} />
}
