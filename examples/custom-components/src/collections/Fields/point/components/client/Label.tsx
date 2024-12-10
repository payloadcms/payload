'use client'
import type { PointFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldLabelClient: PointFieldLabelClientComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
