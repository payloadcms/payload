import type { NumberFieldServerComponent } from 'payload'

// import { NumberField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomNumberFieldServer: NumberFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <NumberField field={clientField} />

  return 'This is a server component for the number field.'
}
