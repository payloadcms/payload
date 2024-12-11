'use client'

import type { TextFieldServerComponent } from 'payload'

import React from 'react'

export const CustomField: TextFieldServerComponent = ({ schemaPath }) => {
  return <div id="custom-field-schema-path">{schemaPath}</div>
}
