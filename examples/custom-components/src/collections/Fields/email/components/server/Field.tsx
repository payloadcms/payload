import type { EmailFieldServerComponent } from 'payload'
import type React from 'react'

import { EmailField } from '@payloadcms/ui'

export const CustomEmailFieldServer: EmailFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <EmailField field={props?.clientField} path={path} />
}
