'use client'

import type { TextFieldClientProps } from 'payload'

import React from 'react'

export const CustomField: React.FC<TextFieldClientProps> = ({ schemaPath }) => {
  return <div id="custom-field-schema-path">{schemaPath}</div>
}
