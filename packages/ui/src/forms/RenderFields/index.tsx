'use client'

import type { ClientComponentProps, ClientField, FieldPermissions } from 'payload'

import { getFieldPaths } from 'payload/shared'
import React from 'react'

import type { Props } from './types.js'

import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js'
import { ArrayField } from '../../fields/Array/index.js'
import { BlocksField } from '../../fields/Blocks/index.js'
import { CollapsibleField } from '../../fields/Collapsible/index.js'
import { GroupField } from '../../fields/Group/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { RowField } from '../../fields/Row/index.js'
import { TabsField } from '../../fields/Tabs/index.js'
import { useFormFields } from '../../forms/Form/index.js'
import { useFieldComponents } from '../../providers/FieldComponents/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import './index.scss'

const baseClass = 'render-fields'

export { Props }

export const RenderFields: React.FC<Props> = (props) => {
  const {
    className,
    fields,
    forceRender,
    margins,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
    permissions,
    readOnly: readOnlyFromParent,
  } = props

  const operation = useOperation()

  if (fields && fields.length > 0) {
    return (
      <RenderIfInViewport
        className={[
          baseClass,
          className,
          margins && `${baseClass}--margins-${margins}`,
          margins === false && `${baseClass}--margins-none`,
        ]
          .filter(Boolean)
          .join(' ')}
        forceRender={forceRender}
      >
        {fields.map((field, i) => {
          if (!field) {
            // If there are sidebar fields, those fields will be null in the main fields array. This is to keep the order of the fields consistent and
            // maintain the correct index paths for the main fields (i). Thus, we can just return null here.
            return null
          }

          const fieldPermissions: FieldPermissions =
            'name' in field ? permissions?.[field.name] : permissions

          const { indexPath, path, schemaPath } = getFieldPaths({
            field,
            index: i,
            parentIndexPath,
            parentPath,
            parentSchemaPath,
          })

          // if the user cannot read the field, then filter it out
          // this is different from `admin.readOnly` which is executed based on `operation`
          if (
            (fieldPermissions &&
              'read' in fieldPermissions &&
              'permission' in fieldPermissions.read &&
              fieldPermissions?.read?.permission === false) ||
            field?.admin?.disabled
          ) {
            return null
          }

          // `admin.readOnly` displays the value but prevents the field from being edited
          let isReadOnly = readOnlyFromParent || field?.admin?.readOnly

          // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
          if (isReadOnly && field.admin?.readOnly === false) {
            isReadOnly = false
          }

          // if the user does not have access control to begin with, force it to be read-only
          if (
            fieldPermissions &&
            operation in fieldPermissions &&
            'permission' in fieldPermissions[operation] &&
            fieldPermissions[operation]?.permission === false
          ) {
            isReadOnly = true
          }

          return (
            <RenderField
              clientFieldConfig={field}
              forceRender={forceRender}
              indexPath={indexPath}
              key={path}
              parentPath={parentPath}
              parentSchemaPath={parentSchemaPath}
              path={path}
              permissions={fieldPermissions}
              readOnly={isReadOnly}
              schemaPath={schemaPath}
            />
          )
        })}
      </RenderIfInViewport>
    )
  }

  return null
}

type RenderFieldProps = {
  clientFieldConfig: ClientField
  permissions: FieldPermissions
} & Pick<
  ClientComponentProps,
  | 'forceRender'
  | 'indexPath'
  | 'parentPath'
  | 'parentSchemaPath'
  | 'path'
  | 'readOnly'
  | 'schemaPath'
>
function RenderField({
  clientFieldConfig,
  forceRender,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  readOnly,
  schemaPath,
}: RenderFieldProps) {
  const fieldComponents = useFieldComponents()
  const Field = useFormFields(
    ([fields]) => (fields && fields?.[path]?.customComponents?.Field) || null,
  )

  if (Field !== undefined) {
    return Field
  }

  const sharedProps: Pick<
    ClientComponentProps,
    | 'forceRender'
    | 'indexPath'
    | 'parentPath'
    | 'parentSchemaPath'
    | 'path'
    | 'readOnly'
    | 'schemaPath'
  > = {
    forceRender,
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    readOnly,
    schemaPath,
  }

  if (clientFieldConfig.admin?.hidden) {
    return <HiddenField field={clientFieldConfig} {...sharedProps} />
  }

  const DefaultField = fieldComponents?.[clientFieldConfig?.type]

  switch (clientFieldConfig.type) {
    // named fields with subfields
    case 'array':
      return <ArrayField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'blocks':
      return <BlocksField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'group':
      return <GroupField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'tabs':
      return <TabsField {...sharedProps} field={clientFieldConfig} permissions={permissions} />

    // unnamed fields with subfields
    case 'row':
      return <RowField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
    case 'collapsible':
      return (
        <CollapsibleField {...sharedProps} field={clientFieldConfig} permissions={permissions} />
      )

    default:
      return DefaultField ? <DefaultField field={clientFieldConfig} {...sharedProps} /> : null
  }
}
