'use client'
import type { RelationshipFieldClientComponent } from 'payload'

import { RelationshipField } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldClient: RelationshipFieldClientComponent = (props) => {
  const { field } = props

  return <RelationshipField field={field} />
}
