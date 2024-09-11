import type { EmailFieldServerComponent } from 'payload'

// import { EmailField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomEmailFieldServer: EmailFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <EmailField field={clientField} />

  return 'This is a server component for the email field.'
}
