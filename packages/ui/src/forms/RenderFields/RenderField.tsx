'use client'

import type { FieldPermissions } from 'payload/bundle'
import type { FieldTypes } from 'payload/bundle'

import React from 'react'

import type {
  FieldComponentProps,
  MappedField,
} from '../../providers/ComponentMap/buildComponentMap/types.js'

import { HiddenInput } from '../../fields/HiddenInput/index.js'
import { useFieldComponents } from '../../providers/FieldComponents/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'

type Props = {
  CustomField: MappedField['CustomField']
  custom?: Record<any, string>
  disabled: boolean
  fieldComponentProps?: FieldComponentProps
  indexPath?: string
  isHidden?: boolean
  name?: string
  path: string
  permissions?: FieldPermissions
  readOnly?: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  type: keyof FieldTypes
}

export const RenderField: React.FC<Props> = ({
  name,
  type,
  CustomField,
  custom,
  disabled,
  fieldComponentProps,
  indexPath,
  isHidden,
  path: pathFromProps,
  permissions,
  readOnly: readOnlyFromProps,
  schemaPath: schemaPathFromProps,
  siblingPermissions,
}) => {
  const operation = useOperation()
  const { readOnly: readOnlyFromContext } = useFieldProps()
  const fieldComponents = useFieldComponents()

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

  const DefaultField = isHidden ? HiddenInput : fieldComponents[type]

  if (CustomField === undefined && !DefaultField) {
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
      {CustomField !== undefined ? CustomField : <DefaultField {...fieldComponentProps} />}
    </FieldPropsProvider>
  )
}
