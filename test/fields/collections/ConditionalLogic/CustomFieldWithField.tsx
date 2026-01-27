'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

const CustomFieldWithField: TextFieldClientComponent = (props) => {
  return <TextField {...props} />
}

export default CustomFieldWithField
