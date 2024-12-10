import type { SelectFieldServerComponent } from 'payload'
import type React from 'react'

import { SelectField } from '@payloadcms/ui'

export const CustomSelectFieldServer: SelectFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <SelectField field={props?.clientField} path={path} />
}
