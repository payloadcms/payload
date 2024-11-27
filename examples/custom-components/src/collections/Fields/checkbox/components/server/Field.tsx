import type { CheckboxFieldServerComponent } from 'payload'
import type React from 'react'

import { CheckboxField } from '@payloadcms/ui'

export const CustomCheckboxFieldServer: CheckboxFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <CheckboxField field={props?.clientField} path={path} />
}
