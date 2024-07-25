import type { LabelComponent } from 'payload'

import React from 'react'

export const CustomLabel: LabelComponent = (props) => {
  const { maxLength } = props
  return <div id="custom-field-label">{`The max length of this field is: ${maxLength}`}</div>
}
