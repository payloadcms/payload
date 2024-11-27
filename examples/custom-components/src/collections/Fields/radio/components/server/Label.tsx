import type { RadioFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldLabelServer: RadioFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
