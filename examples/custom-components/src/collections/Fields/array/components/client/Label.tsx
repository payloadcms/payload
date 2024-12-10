'use client'
import type { ArrayFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldLabelClient: ArrayFieldLabelClientComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
