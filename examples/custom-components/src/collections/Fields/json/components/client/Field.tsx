'use client'
import type { JSONFieldClientComponent } from 'payload'

import { JSONField } from '@payloadcms/ui'
import React from 'react'

export const CustomJSONFieldClient: JSONFieldClientComponent = (props) => {
  return <JSONField {...props} />
}
