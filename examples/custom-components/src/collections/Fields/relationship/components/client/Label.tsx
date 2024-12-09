'use client'
import type { RelationshipFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelClient: RelationshipFieldLabelClientComponent = (
  props,
) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
