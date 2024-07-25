import type { DescriptionComponent } from 'payload'

import React from 'react'

export const CustomTextDescription: DescriptionComponent = (props) => {
  return <div>{`The max length of this field is: ${props?.maxLength}`}</div>
}
