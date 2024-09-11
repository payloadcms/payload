import type { RadioFieldServerComponent } from 'payload'

// import { RadioGroupField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomRadioFieldServer: RadioFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <RadioGroupField field={clientField} />

  return 'This is a server component for the radio field.'
}
