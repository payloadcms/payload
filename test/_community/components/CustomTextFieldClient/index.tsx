'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField, useField, useFormFields } from '@payloadcms/ui'
import React from 'react'

export const CustomTextFieldClient: TextFieldClientComponent = (props) => {
  // to test useFormFields
  //   const customField = useFormFields(([fields, dispatch]) => fields.customField)

  // to test useField
  const path = props.path || ''
  const customField = useField({ path })

  console.log('In CustomTextFieldClient', customField?.value)

  return <TextField {...props} />
}
