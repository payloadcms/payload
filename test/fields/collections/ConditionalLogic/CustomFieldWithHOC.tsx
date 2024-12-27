'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField, withCondition } from '@payloadcms/ui'
import React from 'react'

const MyField: TextFieldClientComponent = (props) => {
  return <TextField {...props} />
}

export default withCondition(MyField)
