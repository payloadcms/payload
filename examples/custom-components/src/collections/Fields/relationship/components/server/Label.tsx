import type { RelationshipFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelServer: RelationshipFieldLabelServerComponent = (
  props,
) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the relationship field label.'
}
