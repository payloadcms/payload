'use client'
import type { TextFieldClientProps } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

const CustomFieldWithField: React.FC<TextFieldClientProps> = (props) => {
  return <TextField {...props} />
}

export default CustomFieldWithField
