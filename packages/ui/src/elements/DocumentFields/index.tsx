'use client'
import type { ClientField, SanitizedDocumentPermissions } from 'payload'

import { fieldIsSidebar } from 'payload/shared'
import React, { useMemo } from 'react'

import { useFormInitializing, useFormProcessing } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { Gutter } from '../Gutter/index.js'
import './index.scss'

const baseClass = 'document-fields'

type Args = {
  readonly AfterFields?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly Description?: React.ReactNode
  readonly docPermissions: SanitizedDocumentPermissions
  readonly fields: ClientField[]
  readonly forceSidebarWrap?: boolean
  readonly readOnly?: boolean
  readonly schemaPathSegments: string[]
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  Description,
  docPermissions,
  fields,
  forceSidebarWrap,
  readOnly,
  schemaPathSegments,
}) => {
  const { hasSidebarFields, mainFields, sidebarFields } = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        if (fieldIsSidebar(field)) {
          acc.sidebarFields.push(field)
          acc.mainFields.push(null)
          acc.hasSidebarFields = true
        } else {
          acc.mainFields.push(field)
          acc.sidebarFields.push(null)
        }
        return acc
      },
      {
        hasSidebarFields: false,
        mainFields: [] as ClientField[],
        sidebarFields: [] as ClientField[],
      },
    )
  }, [fields])

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
          {Description ? (
            <header className={`${baseClass}__header`}>
              <div className={`${baseClass}__sub-header`}>{Description}</div>
            </header>
          ) : null}
          {BeforeFields}
          <RenderFields
            className={`${baseClass}__fields`}
            fields={mainFields}
            forceRender
            parentIndexPath=""
            parentPath=""
            parentSchemaPath={schemaPathSegments.join('.')}
            permissions={docPermissions?.fields}
            readOnly={readOnly}
          />
          {AfterFields}
        </Gutter>
      </div>
      {hasSidebarFields ? (
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-fields`}>
              <RenderFields
                fields={sidebarFields}
                forceRender
                parentIndexPath=""
                parentPath=""
                parentSchemaPath={schemaPathSegments.join('.')}
                permissions={docPermissions?.fields}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
