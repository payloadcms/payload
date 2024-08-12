'use client'

import type { ClientField, FieldPermissions } from 'payload'

import { HiddenField, useFieldComponents } from '@payloadcms/ui'
import { deepCopyObjectComplex } from 'payload/shared'
import React from 'react'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useOperation } from '../../providers/Operation/index.js'
import { FieldPropsProvider, useFieldProps } from '../FieldPropsProvider/index.js'

type Props = {
  readonly fieldComponentProps?: {
    field: ClientField
    forceRender?: boolean
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

  // `admin.readOnly` displays the value but prevents the field from being edited
  let readOnly = fieldComponentProps?.field?.admin?.readOnly

  // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
  if (readOnlyFromContext && readOnly !== false) readOnly = true

  // if the user does not have access control to begin with, force it to be read-only
  if (permissions?.[operation]?.permission === false) {
    readOnly = true
  }

  let RenderedField: React.ReactElement

  // hide from admin if field is `admin.hidden: true`
  if (
    'admin' in fieldComponentProps.field &&
    'hidden' in fieldComponentProps.field.admin &&
    fieldComponentProps.field.admin.hidden
  ) {
    RenderedField = <HiddenField {...fieldComponentProps} />
  } else {
    // TODO: We have to deepCopyObjectComplex (not deepCopySimple, as React components, richtext component map & other complex objects can be inside) the field prop to avoid mutating the readOnly prop of the original object
    // TODO: We should find a better solution for this eventually, as deep copying objects is not performant
    const deepCopiedFieldProp: ClientField = deepCopyObjectComplex(
      fieldComponentProps?.field ?? {},
    ) as ClientField
    if (!deepCopiedFieldProp.admin) {
      deepCopiedFieldProp.admin = {}
    }
    deepCopiedFieldProp.admin.readOnly = readOnly

    RenderedField = (
      <RenderComponent
        Component={fieldComponents?.[fieldComponentProps?.field?.type]}
        clientProps={{
          ...fieldComponentProps,
          field: deepCopiedFieldProp,
          test: path,
        }}
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
      readOnly={readOnly}
      schemaPath={schemaPath}
      siblingPermissions={siblingPermissions}
      type={fieldComponentProps?.field?.type}
    >
      {RenderedField}
    </FieldPropsProvider>
  )
}
