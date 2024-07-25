import type { DescriptionComponent } from 'payload'

import React from 'react'

export const CustomDescription: DescriptionComponent = (props) => {
  return (
    <div id="custom-field-description">{`The max length of this field is: ${props?.maxLength}`}</div>
  )
}
