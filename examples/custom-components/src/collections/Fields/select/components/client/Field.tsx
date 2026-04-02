'use client'
import type { SelectFieldClientComponent } from 'payload'

import { SelectField } from '@payloadcms/ui'
import React from 'react'

export const CustomSelectFieldClient: SelectFieldClientComponent = (props) => {
  return <SelectField {...props} />
}
