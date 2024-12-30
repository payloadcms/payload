'use client'
import type { DateFieldClientComponent } from 'payload'

import { DateTimeField } from '@payloadcms/ui'
import React from 'react'

export const CustomDateFieldClient: DateFieldClientComponent = (props) => {
  return <DateTimeField field={props?.field} path={props?.path} />
}
