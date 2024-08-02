'use client'

import type { ClientFieldConfig, FieldComponentProps, FieldPermissions, FieldTypes } from 'payload'

import React from 'react'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useOperation } from '../../providers/Operation/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'

type Props = {
  readonly Field: ClientFieldConfig['admin']['components']['Field']
  readonly custom?: Record<any, string>
  readonly disabled: boolean
  readonly fieldComponentProps?: {
    forceRender?: boolean
  } & FieldComponentProps
  readonly indexPath?: string
  readonly isHidden?: boolean
  readonly name?: string
  readonly path: string
  readonly permissions?: FieldPermissions
  readonly readOnly?: boolean
  readonly schemaPath: string
  readonly siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  readonly type: FieldTypes
}

export const RenderField: React.FC<Props> = ({
  name,
  type,
  Field,
  custom,
  disabled,
  fieldComponentProps,
  indexPath,
  path: pathFromProps,
  permissions,
  readOnly: readOnlyFromProps,
  schemaPath: schemaPathFromProps,
  siblingPermissions,
}) => {
  const operation = useOperation()
  const { readOnly: readOnlyFromContext } = useFieldProps()

  const path = [pathFromProps, name].filter(Boolean).join('.')
  const schemaPath = [schemaPathFromProps, name].filter(Boolean).join('.')

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

  if (Field === undefined) {
    return null
  }

  return (
    <FieldPropsProvider
      custom={custom}
      indexPath={indexPath}
      path={path}
      permissions={permissions}
      readOnly={readOnly}
      schemaPath={schemaPath}
      siblingPermissions={siblingPermissions}
      type={type}
    >
      <RenderComponent clientProps={fieldComponentProps} mappedComponent={Field} />
    </FieldPropsProvider>
  )
}
