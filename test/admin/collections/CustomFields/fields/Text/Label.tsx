import type { TextFieldLabelComponent } from 'payload'

import React from 'react'

export const CustomLabel: TextFieldLabelComponent = (props) => {
  return <div id="custom-field-label">{`The max length of this field is: ${props?.maxLength}`}</div>
}
