'use client'

import type { DocumentViewClientProps } from '@ruya.sa/payload'

import { DefaultEditView } from '@ruya.sa/ui'
import React from 'react'

export const EditView: React.FC<DocumentViewClientProps> = (props) => {
  return <DefaultEditView {...props} />
}
