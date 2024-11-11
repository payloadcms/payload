'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyClientFieldComponent: TextFieldClientComponent = ({
  field,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  schemaPath,
}) => {
  return (
    <>
      <h1>HELLO</h1>
      <p>{path}</p>
      <TextField
        field={field}
        indexPath={indexPath}
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        path={path}
        schemaPath={schemaPath}
      />
    </>
  )
}
