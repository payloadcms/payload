'use client'
import type { TextFieldClientProps } from 'payload'
import type React from 'react'

import { useField } from '@payloadcms/ui'

export const RenderTracker: React.FC<TextFieldClientProps> = ({ path }) => {
  useField({ path })
  console.count('Renders') // eslint-disable-line no-console
  return null
}
