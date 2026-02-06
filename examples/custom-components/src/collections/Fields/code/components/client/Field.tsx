'use client'
import type { CodeFieldClientComponent } from 'payload'

import { CodeField } from '@payloadcms/ui'
import React from 'react'

export const CustomCodeFieldClient: CodeFieldClientComponent = (props) => {
  return <CodeField {...props} />
}
