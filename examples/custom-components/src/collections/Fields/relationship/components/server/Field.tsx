import type { RelationshipFieldServerComponent } from 'payload'
import type React from 'react'

import { RelationshipField } from '@payloadcms/ui'

export const CustomRelationshipFieldServer: RelationshipFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <RelationshipField field={props?.clientField} path={path} />
}
