'use client'

import type { FieldPermissions } from 'payload'

import { getFieldPaths } from 'payload/shared'
import React from 'react'

import type { Props } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js'
import { ArrayField } from '../../fields/Array/index.js'
import { BlocksField } from '../../fields/Blocks/index.js'
import { CollapsibleField } from '../../fields/Collapsible/index.js'
import { GroupField } from '../../fields/Group/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
import { RowField } from '../../fields/Row/index.js'
import { TabsField } from '../../fields/Tabs/index.js'
import { useForm } from '../../forms/Form/context.js'
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

  const { fields: formFields } = useForm()

  const operation = useOperation()

  const fieldComponents = useFieldComponents()

  if (!formFields) {
    return <p>No fields to render</p>
  }

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
          const fieldPermissions: FieldPermissions =
            'name' in field ? permissions?.[field.name] : permissions

          const { indexPath, path, schemaPath } = getFieldPaths({
            field,
            index: i,
            parentIndexPath,
            parentPath,
            parentSchemaPath,
          })

          const formState = formFields[path]

          const CustomField = formState?.customComponents?.Field

          const DefaultField = fieldComponents?.[field?.type]

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

          const sharedProps = {
            fieldState: formState,
            forceRender,
            indexPath,
            parentPath,
            parentSchemaPath,
            path,
            readOnly: isReadOnly,
            schemaPath,
          }

          let FallbackField = null

          switch (field.type) {
            // named fields with subfields
            case 'array':
              FallbackField = (
                <ArrayField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break
            case 'blocks':
              FallbackField = (
                <BlocksField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break
            case 'group':
              FallbackField = (
                <GroupField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break
            case 'tabs':
              FallbackField = (
                <TabsField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break

            // unnamed fields with subfields
            case 'row':
              FallbackField = (
                <RowField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break
            case 'collapsible':
              FallbackField = (
                <CollapsibleField {...sharedProps} field={field} permissions={fieldPermissions} />
              )
              break

            default:
              FallbackField = <DefaultField field={field} {...sharedProps} />
              break
          }

          if (field.admin?.hidden) {
            FallbackField = <HiddenField field={field} {...sharedProps} />
          }

          return (
            <RenderCustomComponent CustomComponent={CustomField} Fallback={FallbackField} key={i} />
          )
        })}
      </RenderIfInViewport>
    )
  }

  return null
}
