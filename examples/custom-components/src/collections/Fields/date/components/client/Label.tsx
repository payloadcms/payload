'use client'
import type { DateFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldLabelClient: DateFieldLabelClientComponent = ({ field, path }) => {
  return <FieldLabel label={field?.label || field?.name} path={path} required={field?.required} />
}
