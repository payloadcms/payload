'use client'
import type { TextFieldLabelClientProps } from 'payload'

import React from 'react'

export const CustomClientLabel: React.FC<TextFieldLabelClientProps> = (props) => {
  return (
    <div id="custom-client-field-label">{`Label: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
