'use client'
import type { EmailFieldClientProps } from 'payload'

import { EmailField } from '@payloadcms/ui'
import React from 'react'

export const CustomEmailFieldClient: React.FC<EmailFieldClientProps> = (props) => {
  return <EmailField {...props} />
}
