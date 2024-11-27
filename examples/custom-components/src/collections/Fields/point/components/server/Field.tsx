import type { PointFieldServerComponent } from 'payload'
import type React from 'react'

import { PointField } from '@payloadcms/ui'

export const CustomPointFieldServer: PointFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <PointField field={props?.clientField} path={path} />
}
