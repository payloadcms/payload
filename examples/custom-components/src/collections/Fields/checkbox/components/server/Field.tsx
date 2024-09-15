import type { CheckboxFieldServerComponent } from 'payload'

// import { CheckboxField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomCheckboxFieldServer: CheckboxFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <CheckboxField field={clientField} />

  return 'This is a server component for the checkbox field.'
}
