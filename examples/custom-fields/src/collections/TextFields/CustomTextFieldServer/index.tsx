import type { TextFieldProps } from 'payload'

// import { TextField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomTextFieldServer: React.FC<TextFieldProps> = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <TextField field={clientField} />

  return null
}
