'use client'

import { getFieldPaths } from 'payload/shared'
import React from 'react'

import type { Props } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js'
import { HiddenField } from '../../fields/Hidden/index.js'
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
          if (!field) {
            // If there are sidebar fields, those fields will be null in the main fields array. This is to keep the order of the fields consistent and
            // maintain the correct index paths for the main fields (i). Thus, we can just return null here.
            return null
          }
          const fieldPermissions = 'name' in field ? permissions?.[field.name] : permissions

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
          if (fieldPermissions?.read?.permission === false || field?.admin?.disabled) {
            return null
          }

          // `admin.readOnly` displays the value but prevents the field from being edited
          let isReadOnly = readOnlyFromParent || field?.admin?.readOnly

          // if parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
          if (isReadOnly && field.admin?.readOnly === false) {
            isReadOnly = false
          }

          // if the user does not have access control to begin with, force it to be read-only
          if (fieldPermissions?.[operation]?.permission === false) {
            isReadOnly = true
          }

          // if the field is hidden, then filter it out
          if (field.admin?.hidden) {
            return (
              <HiddenField
                field={field}
                fieldState={formState}
                forceRender={forceRender}
                indexPath={indexPath}
                key={i}
                parentPath={parentPath}
                parentSchemaPath={parentSchemaPath}
                path={path}
                permissions={fieldPermissions}
                readOnly={isReadOnly}
                schemaPath={schemaPath}
              />
            )
          }

          return (
            <RenderCustomComponent
              CustomComponent={CustomField}
              Fallback={
                <DefaultField
                  field={field}
                  fieldState={formState}
                  forceRender={forceRender}
                  indexPath={indexPath}
                  key={i}
                  parentPath={parentPath}
                  parentSchemaPath={parentSchemaPath}
                  path={path}
                  permissions={fieldPermissions}
                  readOnly={isReadOnly}
                  schemaPath={schemaPath}
                />
              }
              key={i}
            />
          )
        })}
      </RenderIfInViewport>
    )
  }

  return null
}
