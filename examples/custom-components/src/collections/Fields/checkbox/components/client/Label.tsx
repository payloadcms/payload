'use client'
import type { CheckboxFieldLabelClientComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldLabelClient: CheckboxFieldLabelClientComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
