'use client'

import type { TextFieldClientComponent } from 'payload'

import React from 'react'

export const CustomField: TextFieldClientComponent = ({ schemaPath }) => {
  return <div id="custom-field-schema-path">{schemaPath}</div>
}
