import type { RelationshipFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelServer: RelationshipFieldLabelServerComponent = (
  props,
) => {
  return <FieldLabel label={props?.label} />
}
