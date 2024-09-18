import type { DateFieldServerComponent } from 'payload'
import type React from 'react'

import { DateTimeField } from '@payloadcms/ui'

export const CustomDateFieldServer: DateFieldServerComponent = ({ clientField }) => {
  return <DateTimeField field={clientField} />
}
