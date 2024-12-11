import type { PointFieldLabelServerComponent } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldLabelServer: PointFieldLabelServerComponent = (props) => {
  return <FieldLabel label={props?.label} />
}
