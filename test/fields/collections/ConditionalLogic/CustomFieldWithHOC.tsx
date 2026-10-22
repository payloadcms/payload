'use client'
import type { TextFieldClientProps } from 'payload'

import { TextField, withCondition } from '@payloadcms/ui'
import React from 'react'

const MyField: React.FC<TextFieldClientProps> = (props) => {
  return <TextField {...props} />
}

export default withCondition(MyField)
