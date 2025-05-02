'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'

export const SelfManagedFields: TextFieldClientComponent = ({ path }) => {
  return <TextField field={{ name: 'someName', type: 'text' }} path={`${path}.selfManagedField`} />
}
