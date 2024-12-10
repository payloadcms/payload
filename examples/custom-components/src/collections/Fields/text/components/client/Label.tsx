'use client'
import type { TextFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldLabelClient: TextFieldLabelClientComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
