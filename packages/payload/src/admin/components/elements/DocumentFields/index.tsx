import React from 'react'

import type { CollectionPermission, GlobalPermission } from '../../../../auth'
import type { FieldWithPath } from '../../../../fields/config/types'
import type { Description } from '../../forms/FieldDescription/types'
import type { FieldTypes } from '../../forms/field-types'

import RenderFields from '../../forms/RenderFields'
import { filterFields } from '../../forms/RenderFields/filterFields'
import { Gutter } from '../Gutter'
import ViewDescription from '../ViewDescription'
import './index.scss'
import { useOperation } from '../../utilities/OperationProvider'

const baseClass = 'document-fields'

export const DocumentFields: React.FC<{
  AfterFields?: React.ReactNode
  BeforeFields?: React.ReactNode
  description?: Description
  fieldTypes: FieldTypes
  fields: FieldWithPath[]
  forceSidebarWrap?: boolean
  hasSavePermission: boolean
  permissions: CollectionPermission | GlobalPermission
}> = (props) => {
  const {
    AfterFields,
    BeforeFields,
    description,
    fieldTypes,
    fields,
    forceSidebarWrap,
    hasSavePermission,
    permissions,
  } = props

  const operation = useOperation()

  const sidebarFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => field?.admin?.position === 'sidebar',
    permissions: permissions.fields,
    readOnly: !hasSavePermission,
    operation,
  })

  const hasSidebarFields = sidebarFields && sidebarFields.length > 0

  return (
    <React.Fragment>
      <div
        className={[
          baseClass,
          hasSidebarFields ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`,
          forceSidebarWrap && `${baseClass}--force-sidebar-wrap`,
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
            {BeforeFields || null}
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
            {AfterFields || null}
          </Gutter>
        </div>
        {hasSidebarFields && (
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
