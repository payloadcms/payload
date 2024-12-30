import type { DateFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldLabelServer: DateFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
