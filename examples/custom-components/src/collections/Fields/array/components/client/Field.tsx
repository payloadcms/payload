'use client'
import type { ArrayFieldClientComponent } from 'payload'

import { ArrayField } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldClient: ArrayFieldClientComponent = (props) => {
  const { field } = props

  return <ArrayField field={field} />
}
