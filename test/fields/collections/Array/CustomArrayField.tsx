'use client'
import type { ArrayFieldClientComponent } from 'payload'

import { ArrayField } from '@payloadcms/ui'

export const CustomArrayField: ArrayFieldClientComponent = (props) => {
  return (
    <div id="custom-array-field">
      <ArrayField {...props} />
    </div>
  )
}
