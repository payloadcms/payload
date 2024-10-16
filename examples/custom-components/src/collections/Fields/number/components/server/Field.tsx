import type { NumberFieldServerComponent } from 'payload'
import type React from 'react'

import { NumberField } from '@payloadcms/ui'

export const CustomNumberFieldServer: NumberFieldServerComponent = ({ clientField }) => {
  return <NumberField field={clientField} />
}
