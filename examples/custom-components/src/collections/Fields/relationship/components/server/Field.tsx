import type { RelationshipFieldServerComponent } from 'payload'
import type React from 'react'

import { RelationshipField } from '@payloadcms/ui'

export const CustomRelationshipFieldServer: RelationshipFieldServerComponent = ({
  clientField,
}) => {
  return <RelationshipField field={clientField} />
}
