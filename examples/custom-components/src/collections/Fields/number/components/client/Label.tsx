'use client'
import type { NumberFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomNumberFieldLabelClient: NumberFieldLabelClientComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
