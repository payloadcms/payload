'use client'

import type { ClientField, FieldPermissions } from 'payload'

import React from 'react'

import { RenderComponent } from '../../elements/RenderComponent/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { useFieldComponents } from '../../providers/FieldComponents/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'

type Props = {
  readonly fieldComponentProps?: {
    field: ClientField
    forceRender?: boolean
    readOnly?: boolean
  }
  readonly indexPath?: string
  readonly isHidden?: boolean
  readonly name?: string
  readonly path: string
  readonly permissions?: FieldPermissions
  readonly schemaPath: string
  readonly siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
}

export const RenderField: React.FC<Props> = ({
  name,
  fieldComponentProps,
  indexPath,
  path: pathFromProps,
  permissions,
  schemaPath: schemaPathFromProps,
  siblingPermissions,
}) => {
  const fieldComponents = useFieldComponents()
  const operation = useOperation()
  const { readOnly: readOnlyFromContext } = useFieldProps()

  if (!fieldComponents) {
    return null
  }

  const path = [pathFromProps, name].filter(Boolean).join('.')
  const schemaPath = [schemaPathFromProps, name].filter(Boolean).join('.')

  // if the user cannot read the field, then filter it out
  // this is different from `admin.readOnly` which is executed based on `operation`
  if (permissions?.read?.permission === false || fieldComponentProps?.field?.admin?.disabled) {
    return null
  }

  // Combine readOnlyFromContext with the readOnly prop passed down from RenderFields
  const isReadOnly = fieldComponentProps.readOnly ?? readOnlyFromContext

  // `admin.readOnly` displays the value but prevents the field from being edited
  fieldComponentProps.readOnly = fieldComponentProps?.field?.admin?.readOnly

  // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
  if (isReadOnly && fieldComponentProps.readOnly !== false) {
    fieldComponentProps.readOnly = true
  }

  // if the user does not have access control to begin with, force it to be read-only
  if (permissions?.[operation]?.permission === false) {
    fieldComponentProps.readOnly = true
  }

  let RenderedField: React.ReactElement

  if (fieldComponentProps?.field?.admin?.components?.Field === null) {
    return null
  }

  // hide from admin if field is `admin.hidden: true`
  if (
    'admin' in fieldComponentProps.field &&
    'hidden' in fieldComponentProps.field.admin &&
    fieldComponentProps.field.admin.hidden
  ) {
    RenderedField = (
      <HiddenField
        field={fieldComponentProps.field}
        forceRender={fieldComponentProps.forceRender}
        readOnly={fieldComponentProps.readOnly}
      />
    )
  } else {
    RenderedField = (
      <RenderComponent
        clientProps={{
          field: fieldComponentProps.field,
          forceRender: fieldComponentProps.forceRender,
          readOnly: fieldComponentProps.readOnly,
        }}
        Component={fieldComponents?.[fieldComponentProps?.field?.type]}
        mappedComponent={fieldComponentProps?.field?.admin?.components?.Field}
      />
    )
  }

  return (
    <FieldPropsProvider
      custom={fieldComponentProps?.field?.admin?.custom}
      indexPath={indexPath}
      path={path}
      permissions={permissions}
      readOnly={fieldComponentProps.readOnly}
      schemaPath={schemaPath}
      siblingPermissions={siblingPermissions}
      type={fieldComponentProps?.field?.type}
    >
      {RenderedField}
    </FieldPropsProvider>
  )
}
