import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = (args) => {
  const {
    clientField,
    fieldState,
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    schemaPath,
    siblingData,
  } = args

  return (
    <React.Fragment>
      <h1>{String(fieldState.value)}</h1>
      <p>{JSON.stringify(siblingData)}</p>
      <p>{path}</p>
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
    </React.Fragment>
  )
}
