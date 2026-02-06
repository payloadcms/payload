'use client'
import type { TextFieldClientComponent } from 'payload'

import { useField } from '@payloadcms/ui'

export const RenderTracker: TextFieldClientComponent = ({ path }) => {
  useField({ path })
  console.count('Renders') // eslint-disable-line no-console
  return null
}
