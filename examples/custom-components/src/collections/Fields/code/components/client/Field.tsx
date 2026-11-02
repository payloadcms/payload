'use client'
import type { CodeFieldClientProps } from 'payload'

import { CodeField } from '@payloadcms/ui'
import React from 'react'

export const CustomCodeFieldClient: React.FC<CodeFieldClientProps> = (props) => {
  return <CodeField {...props} />
}
