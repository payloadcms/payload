import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = ({
  clientField,
  fieldState,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  schemaPath,
}) => {
  console.log('Server field value:', fieldState?.value)
  return (
    <TextField
      field={clientField}
      fieldState={fieldState}
      indexPath={indexPath}
      parentPath={parentPath}
      parentSchemaPath={parentSchemaPath}
      path={path}
      permissions={permissions}
      schemaPath={schemaPath}
    />
  )
}
