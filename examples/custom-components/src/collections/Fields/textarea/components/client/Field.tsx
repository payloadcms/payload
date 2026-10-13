'use client'
import type { TextareaFieldClientProps } from 'payload'

import { TextareaField } from '@payloadcms/ui'
import React from 'react'

export const CustomTextareaFieldClient: React.FC<TextareaFieldClientProps> = (props) => {
  return <TextareaField {...props} />
}
