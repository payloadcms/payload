import type { EmailFieldServerComponent } from 'payload'
import type React from 'react'

import { EmailField } from '@payloadcms/ui'

export const CustomEmailFieldServer: EmailFieldServerComponent = ({ clientField }) => {
  return <EmailField field={clientField} />
}
