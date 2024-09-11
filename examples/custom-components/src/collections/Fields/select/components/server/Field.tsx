import type { SelectFieldServerComponent } from 'payload'

// import { SelectField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomSelectFieldServer: SelectFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <SelectField field={clientField} />

  return 'This is a server component for the select field.'
}
