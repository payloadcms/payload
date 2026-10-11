import type { TextFieldDescriptionServerProps } from 'payload'

import React from 'react'

export const CustomServerDescription: React.FC<TextFieldDescriptionServerProps> = (props) => {
  return (
    <div id="custom-server-field-description">{`Description: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
