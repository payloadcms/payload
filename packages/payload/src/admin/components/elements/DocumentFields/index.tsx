import React from 'react'

import type { CollectionPermission, GlobalPermission } from '../../../../auth'
import type { FieldWithPath } from '../../../../fields/config/types'
import type { Description } from '../../forms/FieldDescription/types'

import RenderFields from '../../forms/RenderFields'
import { filterFields } from '../../forms/RenderFields/filterFields'
import { fieldTypes } from '../../forms/field-types'
import { Gutter } from '../Gutter'
import ViewDescription from '../ViewDescription'
import './index.scss'

const baseClass = 'document-fields'

export const DocumentFields: React.FC<{
  AfterFields?: React.FC
  BeforeFields?: React.FC
  description?: Description
  fields: FieldWithPath[]
  hasSavePermission: boolean
  permissions: CollectionPermission | GlobalPermission
}> = (props) => {
  const { AfterFields, BeforeFields, description, fields, hasSavePermission, permissions } = props

  const sidebarFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => field?.admin?.position === 'sidebar',
    permissions: permissions.fields,
    readOnly: !hasSavePermission,
  })

  const hasSidebar = sidebarFields && sidebarFields.length > 0

  return (
    <React.Fragment>
      <div
        className={[
          baseClass,
          hasSidebar ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__main`}>
          <Gutter className={`${baseClass}__edit`}>
            <header className={`${baseClass}__header`}>
              {description && (
                <div className={`${baseClass}__sub-header`}>
                  <ViewDescription description={description} />
                </div>
              )}
            </header>
            {BeforeFields && <BeforeFields />}
            <RenderFields
              className={`${baseClass}__fields`}
              fieldSchema={fields}
              fieldTypes={fieldTypes}
              filter={(field) =>
                !field.admin.position ||
                (field.admin.position && field.admin.position !== 'sidebar')
              }
              permissions={permissions.fields}
              readOnly={!hasSavePermission}
            />
            {AfterFields && <AfterFields />}
          </Gutter>
        </div>
        {hasSidebar && (
          <div className={`${baseClass}__sidebar-wrap`}>
            <div className={`${baseClass}__sidebar`}>
              <div className={`${baseClass}__sidebar-fields`}>
                <RenderFields
                  fieldTypes={fieldTypes}
                  fields={sidebarFields}
                  permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
