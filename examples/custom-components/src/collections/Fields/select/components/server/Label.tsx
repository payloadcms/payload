import type { SelectFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldLabelServer: SelectFieldLabelServerComponent = (props) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the select field label.'
}
