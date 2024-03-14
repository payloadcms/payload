'use client'

import type { FieldPermissions } from 'payload/types'

import React from 'react'

import { useOperation } from '../../providers/OperationProvider/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'

type Props = {
  Field: React.ReactNode
  disabled: boolean
  name?: string
  path: string
  permissions?: FieldPermissions
  readOnly?: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
}

export const RenderField: React.FC<Props> = ({
  name,
  Field,
  disabled,
  path: pathFromProps,
  permissions,
  readOnly: readOnlyFromProps,
  schemaPath: schemaPathFromProps,
  siblingPermissions,
}) => {
  const operation = useOperation()
  const { readOnly: readOnlyFromContext } = useFieldProps()

  const path = `${pathFromProps ? `${pathFromProps}.` : ''}${name ? `${name}` : ''}`
  const schemaPath = `${schemaPathFromProps ? `${schemaPathFromProps}` : ''}${name ? `.${name}` : ''}`

  // if the user cannot read the field, then filter it out
  // this is different from `admin.readOnly` which is executed based on `operation`
  if (permissions?.read?.permission === false || disabled) {
    return null
  }

  // `admin.readOnly` displays the value but prevents the field from being edited
  let readOnly = readOnlyFromProps

  // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
  if (readOnlyFromContext && readOnly !== false) readOnly = true

  // if the user does not have access control to begin with, force it to be read-only
  if (permissions?.[operation]?.permission === false) {
    readOnly = true
  }

  return (
    <FieldPropsProvider
      path={path}
      permissions={permissions}
      readOnly={readOnly}
      schemaPath={schemaPath}
      siblingPermissions={siblingPermissions}
    >
      {Field}
    </FieldPropsProvider>
  )
}
