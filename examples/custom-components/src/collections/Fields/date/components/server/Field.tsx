import type { DateFieldServerComponent } from 'payload'

// import { DateTimeField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomDateFieldServer: DateFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <DateTimeField field={clientField} />

  return 'This is a server component for the date field.'
}
