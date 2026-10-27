'use client'
import type { ClientField, SanitizedDocumentPermissions } from 'payload'

import { fieldIsSidebar } from 'payload/shared'
import React, { useMemo } from 'react'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { Gutter } from '../Gutter/index.js'
import { TrashBanner } from '../TrashBanner/index.js'
import './index.css'

const baseClass = 'document-fields'

type Args = {
  readonly AfterFields?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly Description?: React.ReactNode
  /**
   * When true, fields with `admin.position: 'sidebar'` render inline in the main column and no
   * sidebar is rendered. Used by upload collections, whose layout has no room for a field sidebar.
   */
  readonly disableSidebar?: boolean
  readonly docPermissions: SanitizedDocumentPermissions
  readonly fields: ClientField[]
  readonly forceSidebarWrap?: boolean
  readonly isTrashed?: boolean
  readonly readOnly?: boolean
  readonly schemaPathSegments: string[]
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  disableSidebar = false,
  docPermissions,
  fields,
  forceSidebarWrap,
  isTrashed = false,
  readOnly,
  schemaPathSegments,
}) => {
  const { hasSidebarFields, mainFields, sidebarFields } = useMemo(() => {
    if (disableSidebar) {
      return {
        hasSidebarFields: false,
        mainFields: fields,
        sidebarFields: [] as ClientField[],
      }
    }

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
  }, [disableSidebar, fields])

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
          {isTrashed && <TrashBanner />}
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
