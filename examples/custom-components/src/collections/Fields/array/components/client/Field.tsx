'use client'
import type { ArrayFieldClientComponent } from 'payload'

import { ArrayField } from '@payloadcms/ui'
import React from 'react'

export const CustomArrayFieldClient: ArrayFieldClientComponent = ({ field }) => {
  return <ArrayField field={field} />
}
