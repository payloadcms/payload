import type { CheckboxFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldLabelServer: CheckboxFieldLabelServerComponent = (props) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the checkbox field label.'
}
