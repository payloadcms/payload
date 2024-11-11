import type { TextFieldServerComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import React from 'react'

export const MyServerFieldComponent: TextFieldServerComponent = (args) => {
  const {
    clientField,
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    schemaPath,
    siblingData,
    value,
  } = args

  return (
    <React.Fragment>
      <h1>{String(value)}</h1>
      <p>{JSON.stringify(siblingData)}</p>
      <p>{path}</p>
      <TextField
        field={clientField}
        indexPath={indexPath}
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        path={path}
        schemaPath={schemaPath}
      />
    </React.Fragment>
  )
}
