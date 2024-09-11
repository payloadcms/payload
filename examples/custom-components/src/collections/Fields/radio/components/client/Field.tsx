'use client'
import type { RadioFieldClientComponent } from 'payload'

import { RadioGroupField } from '@payloadcms/ui'
import React from 'react'

export const CustomRadioFieldClient: RadioFieldClientComponent = (props) => {
  const { field } = props

  return <RadioGroupField field={field} />
}
