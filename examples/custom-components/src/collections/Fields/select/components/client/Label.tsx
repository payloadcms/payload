'use client'
import type { SelectFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldLabelClient: SelectFieldLabelClientComponent = ({ field, path }) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
