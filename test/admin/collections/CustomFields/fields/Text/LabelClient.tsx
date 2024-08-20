'use client'
import type { TextFieldLabelClientComponent } from 'payload'

import React from 'react'

export const CustomClientLabel: TextFieldLabelClientComponent = (props) => {
  return (
    <div id="custom-client-field-label">{`Label: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
