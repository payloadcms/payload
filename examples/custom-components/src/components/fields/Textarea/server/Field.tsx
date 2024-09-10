import type { TextareaFieldServerComponent } from 'payload'

// import { TextareaField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomTextareaFieldServer: TextareaFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <TextareaField field={clientField} />

  return null
}
