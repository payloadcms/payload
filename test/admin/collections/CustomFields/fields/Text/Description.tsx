import type { TextFieldDescriptionServerComponent } from 'payload'

import React from 'react'

export const CustomDescription: TextFieldDescriptionServerComponent = (props) => {
  return (
    <div id="custom-field-description">{`Description: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
