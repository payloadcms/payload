'use client'
import type { RelationshipFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldLabelClient: RelationshipFieldLabelClientComponent = (
  props,
) => {
  const { field, label } = props

  return <FieldLabel field={field} label={label} />
}
