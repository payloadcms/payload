import type { TextFieldLabelServerComponent } from 'payload'

import React from 'react'

export const CustomServerLabel: TextFieldLabelServerComponent = (props) => {
  return (
    <div id="custom-server-field-label">{`Label: the max length of this field is: ${props?.field?.maxLength}`}</div>
  )
}
