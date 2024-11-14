import type { RadioFieldServerComponent } from 'payload'
import type React from 'react'

import { RadioGroupField } from '@payloadcms/ui'

export const CustomRadioFieldServer: RadioFieldServerComponent = ({ clientField }) => {
  return <RadioGroupField field={clientField} />
}
