import type { NumberFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomNumberFieldLabelServer: NumberFieldLabelServerComponent = (props) => {
  const { field } = props

  // return <FieldLabel field={field} />

  return 'This is a server component for the number field label.'
}
