'use client'
import type { DocumentViewClientProps } from 'payload'

import { EditView } from '@payloadcms/next/views'
import React from 'react'

export const MyEditView = (props: DocumentViewClientProps) => {
  return <EditView {...props} />
}
