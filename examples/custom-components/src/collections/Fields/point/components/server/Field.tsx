import type { PointFieldServerComponent } from 'payload'
import type React from 'react'

import { PointField } from '@payloadcms/ui'

export const CustomPointFieldServer: PointFieldServerComponent = ({ clientField }) => {
  return <PointField field={clientField} />
}
