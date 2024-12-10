import type { TextareaFieldServerComponent } from 'payload'
import type React from 'react'

import { TextareaField } from '@payloadcms/ui'

export const CustomTextareaFieldServer: TextareaFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <TextareaField field={props?.clientField} path={path} />
}
