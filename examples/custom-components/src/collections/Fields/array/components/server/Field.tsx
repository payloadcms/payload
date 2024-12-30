import type { ArrayFieldServerComponent } from 'payload'
import type React from 'react'

import { ArrayField } from '@payloadcms/ui'

export const CustomArrayFieldServer: ArrayFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <ArrayField field={props.clientField} path={path} permissions={props?.permissions} />
}
