/* eslint-disable no-console */
'use client'
import type { TextFieldClientComponent } from 'payload'

import React, { useLayoutEffect } from 'react'

export const UICustomClient: TextFieldClientComponent = ({
  field: {
    name,
    admin: { custom },
  },
}) => {
  return <div id={name}>{custom?.customValue}</div>
}

import { TextField, useFormFields } from '@payloadcms/ui'

export const UICustomField: TextFieldClientComponent = (props) => {
  // to test useFormFields
  const uiCustomField = useFormFields(([fields]) => fields.uiCustomField)

  useLayoutEffect(() => {
    console.log(`UICustomField changed`)
  }, [uiCustomField])

  console.log('UICustomField rendered')

  return <TextField {...props} />
}
