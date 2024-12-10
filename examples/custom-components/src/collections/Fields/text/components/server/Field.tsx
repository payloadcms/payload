import type { TextFieldServerComponent } from 'payload'
import type React from 'react'

import { TextField } from '@payloadcms/ui'

export const CustomTextFieldServer: TextFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <TextField field={props?.clientField} path={path} />
}
