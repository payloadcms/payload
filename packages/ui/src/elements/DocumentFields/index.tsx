'use client'
import type { ClientField, Description, DocumentPermissions } from 'payload'

import { fieldIsSidebar } from 'payload/shared'
import React from 'react'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { Gutter } from '../Gutter/index.js'
import './index.scss'

const baseClass = 'document-fields'

type Args = {
  readonly AfterFields?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly description?: Description
  readonly docPermissions: DocumentPermissions
  readonly fields: ClientField[]
  readonly forceSidebarWrap?: boolean
  readonly readOnly: boolean
  readonly schemaPath: string
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  description,
  docPermissions,
  fields,
  forceSidebarWrap,
  readOnly,
  schemaPath,
}) => {
  const mainFields = fields.filter((field) => !fieldIsSidebar(field))

  const sidebarFields = fields.filter((field) => fieldIsSidebar(field))

  const hasSidebarFields = sidebarFields && sidebarFields.length > 0

  return (
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
            fields={mainFields}
            forceRender={10}
            path=""
            permissions={docPermissions?.fields}
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
                fields={sidebarFields}
                forceRender={10}
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
  )
}
