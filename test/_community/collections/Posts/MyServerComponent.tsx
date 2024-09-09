import type { TextFieldServerComponent } from 'payload'

import React from 'react'

export const MyServerComponent: TextFieldServerComponent = (props) => {
  const { field } = props

  return <p>{`The name of this field is: ${field.name}`}</p>
}
