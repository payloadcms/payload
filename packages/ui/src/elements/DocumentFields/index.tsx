'use client'
import React from 'react'

import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type { Description, DocumentPreferences, Payload, SanitizedConfig } from 'payload/types'
import type { Locale } from 'payload/config'

import RenderFields from '../../forms/RenderFields'
import { Gutter } from '../Gutter'
import { Document } from 'payload/types'
import { FormState } from '../../forms/Form/types'
import { useTranslation } from '../../providers/Translation'
import { createFieldMap } from '../../forms/RenderFields/createFieldMap'

import './index.scss'

const baseClass = 'document-fields'

export const DocumentFields: React.FC<{
  AfterFields?: React.ReactNode
  BeforeFields?: React.ReactNode
  description?: Description
  forceSidebarWrap?: boolean
  hasSavePermission: boolean
  docPermissions: CollectionPermission | GlobalPermission
  docPreferences: DocumentPreferences
  data: Document
  formState: FormState
  user: User
  locale?: Locale
  fieldMap?: ReturnType<typeof createFieldMap>
}> = (props) => {
  const {
    AfterFields,
    BeforeFields,
    description,
    forceSidebarWrap,
    hasSavePermission,
    docPermissions,
    docPreferences,
    data,
    formState,
    user,
    locale,
    fieldMap,
  } = props

  const { i18n } = useTranslation()

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
              // permissions={permissions.fields}
              readOnly={!hasSavePermission}
              data={data}
              docPreferences={docPreferences}
              locale={locale}
              fieldMap={mainFields}
            />
            {AfterFields}
          </Gutter>
        </div>
        {hasSidebarFields && (
          <div className={`${baseClass}__sidebar-wrap`}>
            <div className={`${baseClass}__sidebar`}>
              <div className={`${baseClass}__sidebar-fields`}>
                <RenderFields
                  // permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                  data={data}
                  locale={locale}
                  fieldMap={sidebarFields}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
