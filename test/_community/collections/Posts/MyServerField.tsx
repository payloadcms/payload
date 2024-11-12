import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = (args) => {
  const { clientField, indexPath, parentPath, parentSchemaPath, path, schemaPath } = args

  return (
    <TextField
      field={clientField}
      indexPath={indexPath}
      parentPath={parentPath}
      parentSchemaPath={parentSchemaPath}
      path={path}
      schemaPath={schemaPath}
    />
  )
}
