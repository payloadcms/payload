'use client'

import type { ClientSideEditViewProps } from 'payload'

import { DefaultEditView } from '@payloadcms/ui'
import React from 'react'

export const EditView: React.FC<ClientSideEditViewProps> = (props) => {
  return <DefaultEditView {...props} />
}
