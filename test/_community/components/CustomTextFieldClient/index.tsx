'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField, useFormFields } from '@payloadcms/ui'
import React, { useRef } from 'react'

export const CustomTextFieldClient: TextFieldClientComponent = (props) => {
  // to test useFormFields
  const customField = useFormFields(([fields, dispatch]) => fields.customField)
  const renderCount = useRef(0)
  renderCount.current++

  console.log(
    `CustomTextFieldClient rendered ${renderCount.current} times, customField value:`,
    customField?.value,
  )

  return <TextField {...props} />
}
