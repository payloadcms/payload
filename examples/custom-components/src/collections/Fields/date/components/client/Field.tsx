'use client'
import type { DateFieldClientComponent } from 'payload'

import { DateTimeField } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldClient: DateFieldClientComponent = ({ field }) => {
  return <DateTimeField field={field} />
}
