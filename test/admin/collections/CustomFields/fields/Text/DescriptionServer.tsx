import type { TextFieldDescriptionServerComponent } from 'payload'

import React from 'react'

export const CustomServerDescription: TextFieldDescriptionServerComponent = (props) => {
  return (
    <div id="custom-server-field-description">{`Description: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
