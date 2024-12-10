import type { RadioFieldServerComponent } from 'payload'
import type React from 'react'

import { RadioGroupField } from '@payloadcms/ui'

export const CustomRadioFieldServer: RadioFieldServerComponent = (props) => {
  const path = (props?.path || props?.field?.name || '') as string
  return <RadioGroupField field={props?.clientField} path={path} />
}
