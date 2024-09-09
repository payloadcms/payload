'use client'
import type { TextFieldClientComponent } from 'payload'

import React from 'react'

export const MyClientComponent: TextFieldClientComponent = (props) => {
  const { field } = props
  return <p>{`The name of this field is: ${field.name}`}</p>
}
