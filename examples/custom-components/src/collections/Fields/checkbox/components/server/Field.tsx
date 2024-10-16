import type { CheckboxFieldServerComponent } from 'payload'
import type React from 'react'

import { CheckboxField } from '@payloadcms/ui'

export const CustomCheckboxFieldServer: CheckboxFieldServerComponent = ({ clientField }) => {
  return <CheckboxField field={clientField} />
}
