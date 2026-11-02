'use client'
import type { TextFieldDescriptionClientProps } from 'payload'

import React from 'react'

export const CustomClientDescription: React.FC<TextFieldDescriptionClientProps> = (props) => {
  return (
    <div id="custom-client-field-description">{`Description: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
