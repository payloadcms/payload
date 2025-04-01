'use client'

import { fieldIsHiddenOrDisabled, getFieldPaths, getFieldPermissions } from 'payload/shared'
import React from 'react'

import type { RenderFieldsProps } from './types.js'

import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js'
import { useOperation } from '../../providers/Operation/index.js'
import { RenderField } from './RenderField.js'
import './index.scss'

const baseClass = 'render-fields'

export { RenderFieldsProps as Props }

export const RenderFields: React.FC<RenderFieldsProps> = (props) => {
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
          // For sidebar fields in the main fields array, `field` will be `null`, and visa versa
          // This is to keep the order of the fields consistent and maintain the correct index paths for the main fields (i)
          if (!field || fieldIsHiddenOrDisabled(field)) {
            return null
          }

          const {
            operation: hasOperationPermission,
            permissions: fieldPermissions,
            read: hasReadPermission,
          } = getFieldPermissions({
            field,
            operation,
            parentName: parentPath?.includes('.')
              ? parentPath.split('.')[parentPath.split('.').length - 1]
              : parentPath,
            permissions,
          })

          // If the user cannot read the field, then filter it out
          // This is different from `admin.readOnly` which is executed based on `operation`
          if ('name' in field && !hasReadPermission) {
            return null
          }

          // `admin.readOnly` displays the value but prevents the field from being edited
          let isReadOnly = readOnlyFromParent || field?.admin?.readOnly

          // If parent field is `readOnly: true`, but this field is `readOnly: false`, the field should still be editable
          if (isReadOnly && field.admin?.readOnly === false) {
            isReadOnly = false
          }

          // If the user does not have access at the operation level, to begin with, force it to be read-only
          if ('name' in field && !hasOperationPermission) {
            isReadOnly = true
          }

          const { indexPath, path, schemaPath } = getFieldPaths({
            field,
            index: i,
            parentIndexPath,
            parentPath,
            parentSchemaPath,
          })

          return (
            <RenderField
              clientFieldConfig={field}
              forceRender={forceRender}
              indexPath={indexPath}
              key={`${path}-${i}`}
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
