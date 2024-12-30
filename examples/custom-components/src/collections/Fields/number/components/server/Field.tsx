import type { NumberFieldServerComponent } from 'payload'
import type React from 'react'

import { NumberField } from '@payloadcms/ui'

export const CustomNumberFieldServer: NumberFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <NumberField field={props?.clientField} path={path} />
}
