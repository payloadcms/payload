import type { RelationshipFieldServerComponent } from 'payload'

// import { RelationshipField } from '@payloadcms/ui'
// import { createClientField } from '@payloadcms/ui/shared'
import type React from 'react'

export const CustomRelationshipFieldServer: RelationshipFieldServerComponent = (props) => {
  const { field } = props

  // const clientField = createClientField(field)

  // return <RelationshipField field={clientField} />

  return 'This is a server component for the relationship field.'
}
