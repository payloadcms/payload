'use client'
import type { CheckboxFieldClientComponent } from 'payload'

import { CheckboxField } from '@payloadcms/ui'
import React from 'react'

export const CustomCheckboxFieldClient: CheckboxFieldClientComponent = (props) => {
  const { field } = props

  return <CheckboxField field={field} />
}
