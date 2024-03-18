'use client'

import type { FieldPermissions } from 'payload/types'

import React from 'react'

import { useOperation } from '../../providers/OperationProvider/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'
import { FieldComponentProps, MappedField } from '../../utilities/buildComponentMap/types.js'
import { useFieldComponents } from '../../providers/FieldComponentsProvider/index.js'
import { FieldTypes } from 'payload/config.js'

type Props = {
  CustomField: MappedField['CustomField']
  disabled: boolean
  name?: string
  path: string
  permissions?: FieldPermissions
  readOnly?: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  fieldComponentProps?: FieldComponentProps
  type: keyof FieldTypes
}

export const RenderField: React.FC<Props> = ({
  name,
  CustomField,
  disabled,
  path: pathFromProps,
  permissions,
  readOnly: readOnlyFromProps,
  schemaPath: schemaPathFromProps,
  siblingPermissions,
  type,
  fieldComponentProps,
}) => {
  const operation = useOperation()
  const { readOnly: readOnlyFromContext } = useFieldProps()
  const fieldComponents = useFieldComponents()

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

  const DefaultField = fieldComponents[type]

  if (!CustomField && !DefaultField) {
    return null
  }

  return (
    <FieldPropsProvider
      path={path}
      permissions={permissions}
      readOnly={readOnly}
      schemaPath={schemaPath}
      siblingPermissions={siblingPermissions}
    >
      {CustomField || <DefaultField {...fieldComponentProps} />}
    </FieldPropsProvider>
  )
}
