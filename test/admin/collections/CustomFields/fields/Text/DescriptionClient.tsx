'use client'
import type { TextFieldDescriptionClientComponent } from 'payload'

import React from 'react'

export const CustomClientDescription: TextFieldDescriptionClientComponent = (props) => {
  return (
    <div id="custom-client-field-description">{`Description: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
