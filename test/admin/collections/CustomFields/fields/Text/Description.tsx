import type { TextFieldDescriptionComponent } from 'payload'

import React from 'react'

export const CustomDescription: TextFieldDescriptionComponent = (props) => {
  return (
    <div id="custom-field-description">{`Description: the max length of this field is: ${props?.maxLength}`}</div>
  )
}
