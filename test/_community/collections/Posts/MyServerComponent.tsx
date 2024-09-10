import type { TextFieldLabelServerComponent } from 'payload'

import React from 'react'

export const MyServerComponent: TextFieldLabelServerComponent = (props) => {
  const { field } = props

  return (
    <div>
      <p>{`The name of this field is: ${field.name}`}</p>
    </div>
  )
}
