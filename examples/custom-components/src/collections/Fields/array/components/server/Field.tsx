import type { ArrayFieldServerComponent } from 'payload'
import type React from 'react'

import { ArrayField } from '@payloadcms/ui'

export const CustomArrayFieldServer: ArrayFieldServerComponent = ({ clientField }) => {
  return <ArrayField field={clientField} />
}
