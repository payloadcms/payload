import type { DateFieldServerComponent } from 'payload'
import type React from 'react'

import { DateTimeField } from '@payloadcms/ui'

export const CustomDateFieldServer: DateFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <DateTimeField field={props?.clientField} path={path} />
}
