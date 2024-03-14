'use client'
import type { Description, DocumentPermissions } from 'payload/types'

import React from 'react'

import type { FieldMap } from '../../utilities/buildComponentMap/types.js'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { Gutter } from '../Gutter/index.js'
import './index.scss'

const baseClass = 'document-fields'

type Args = {
  AfterFields?: React.ReactNode
  BeforeFields?: React.ReactNode
  description?: Description
  docPermissions: DocumentPermissions
  fieldMap: FieldMap
  forceSidebarWrap?: boolean
  readOnly: boolean
  schemaPath: string
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  description,
  docPermissions,
  fieldMap,
  forceSidebarWrap,
  readOnly,
  schemaPath,
}) => {
  const mainFields = fieldMap.filter(({ isSidebar }) => !isSidebar)

  const sidebarFields = fieldMap.filter(({ isSidebar }) => isSidebar)

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
                  {/* <ViewDescription description={description} /> */}
                </div>
              )}
            </header>
            {BeforeFields}
            <RenderFields
              className={`${baseClass}__fields`}
              fieldMap={mainFields}
              path=""
              permissions={docPermissions?.['fields']}
              readOnly={readOnly}
              schemaPath={schemaPath}
            />
            {AfterFields}
          </Gutter>
        </div>
        {hasSidebarFields && (
          <div className={`${baseClass}__sidebar-wrap`}>
            <div className={`${baseClass}__sidebar`}>
              <div className={`${baseClass}__sidebar-fields`}>
                <RenderFields
                  fieldMap={sidebarFields}
                  path=""
                  permissions={docPermissions?.fields}
                  readOnly={readOnly}
                  schemaPath={schemaPath}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
