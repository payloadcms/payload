'use client'
import type { FieldPermissions } from 'payload/auth'

import React from 'react'

import { useOperation } from '../../providers/OperationProvider/index.js'
import { FieldPathProvider, useFieldPath } from '../FieldPathProvider/index.js'
import { ReadOnlyProvider, useReadOnly } from '../ReadOnlyProvider/index.js'

export const RenderField: React.FC<{
  Field: React.ReactNode
  fieldPermissions: FieldPermissions
  name?: string
  readOnly?: boolean
}> = (props) => {
  const { name, Field, fieldPermissions, readOnly: readOnlyFromProps } = props

  const { path: pathFromContext, schemaPath: schemaPathFromContext } = useFieldPath()

  const readOnlyFromContext = useReadOnly()

  const operation = useOperation()

  const path = `${pathFromContext ? `${pathFromContext}.` : ''}${name ? `${name}` : ''}`
  const schemaPath = `${schemaPathFromContext ? `${schemaPathFromContext}` : ''}${name ? `.${name}` : ''}`

  // if the user cannot read the field, then filter it out
  // this is different from `admin.readOnly` which is executed based on `operation`
  if (fieldPermissions?.read?.permission === false) {
    return null
  }

  // `admin.readOnly` displays the value but prevents the field from being edited
  let readOnly = readOnlyFromProps

  // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
  if (readOnlyFromContext && readOnly !== false) readOnly = true

  // if the user does not have access control to begin with, force it to be read-only
  if (fieldPermissions?.[operation]?.permission === false) {
    readOnly = true
  }

  return (
    <ReadOnlyProvider readOnly={readOnly}>
      <FieldPathProvider path={path} schemaPath={schemaPath}>
        {Field}
      </FieldPathProvider>
    </ReadOnlyProvider>
  )
}
