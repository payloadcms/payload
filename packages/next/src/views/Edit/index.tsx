'use client'

import type { DocumentViewServerProps } from 'payload'

import { DefaultEditView } from '@payloadcms/ui'
import React from 'react'

export const EditView: React.FC<DocumentViewServerProps> = (props) => {
  return <DefaultEditView {...props} />
}
