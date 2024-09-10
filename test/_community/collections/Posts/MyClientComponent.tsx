'use client'
import type { TextFieldLabelClientComponent } from 'payload'

import React from 'react'

export const MyClientComponent: TextFieldLabelClientComponent = (props) => {
  const { field } = props
  return <p>{`The name of this field is: ${field.name}`}</p>
}
