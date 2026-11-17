'use client'
import type { RelationshipFieldClientProps } from 'payload'

import { RelationshipField } from '@payloadcms/ui'
import React from 'react'

export const CustomRelationshipFieldClient: React.FC<RelationshipFieldClientProps> = (props) => {
  return <RelationshipField {...props} />
}
