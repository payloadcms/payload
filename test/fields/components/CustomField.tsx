import type { TextFieldServerComponent } from 'payload'

import React from 'react'

export const CustomField: TextFieldServerComponent = ({ schemaPath }) => {
  return <p id="custom-field-schema-path">{schemaPath}</p>
}
