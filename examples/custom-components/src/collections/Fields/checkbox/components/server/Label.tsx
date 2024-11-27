import type { CheckboxFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldLabelServer: CheckboxFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} path={props?.path} />
}
