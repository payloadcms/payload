'use client'
import type { JSONFieldClientProps } from 'payload'

import { JSONField } from '@payloadcms/ui'
import React from 'react'

export const CustomJSONFieldClient: React.FC<JSONFieldClientProps> = (props) => {
  return <JSONField {...props} />
}
