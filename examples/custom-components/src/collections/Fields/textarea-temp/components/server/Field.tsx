import type { TextareaFieldServerComponent } from 'payload'
import type React from 'react'

import { TextareaField } from '@payloadcms/ui'

export const CustomTextareaFieldServer: TextareaFieldServerComponent = ({ clientField }) => {
  return <TextareaField field={clientField} />
}
