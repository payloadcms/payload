import type { PointFieldServerComponent } from 'payload'

// import { PointField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomPointFieldServer: PointFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <PointField field={clientField} />

  return 'This is a server component for the point field.'
}
