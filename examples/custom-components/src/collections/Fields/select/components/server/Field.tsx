import type { SelectFieldServerComponent } from 'payload'
import type React from 'react'

import { SelectField } from '@payloadcms/ui'

export const CustomSelectFieldServer: SelectFieldServerComponent = ({ clientField }) => {
  return <SelectField field={clientField} />
}
