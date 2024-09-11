import type { ArrayFieldServerComponent } from 'payload'

// import { ArrayField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomArrayFieldServer: ArrayFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <ArrayField field={clientField} />

  return 'This is a server component for the array field.'
}
