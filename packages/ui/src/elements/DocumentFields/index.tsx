import React from 'react'

import type { CollectionPermission, GlobalPermission, User } from 'payload/auth'
import type { Description, DocumentPreferences, Payload, SanitizedConfig } from 'payload/types'
import type { FieldTypes, Locale } from 'payload/config'

import RenderFields from '../../forms/RenderFields'
import { filterFields } from '../../forms/RenderFields/filterFields'
import { Gutter } from '../Gutter'
import './index.scss'
import { Document, FieldWithPath } from 'payload/types'
import { FormState } from '../../forms/Form/types'
import { I18n } from '@payloadcms/translations'

const baseClass = 'document-fields'

export const DocumentFields: React.FC<{
  AfterFields?: React.ReactNode
  BeforeFields?: React.ReactNode
  description?: Description
  fieldTypes: FieldTypes
  fields: FieldWithPath[]
  forceSidebarWrap?: boolean
  hasSavePermission: boolean
  docPermissions: CollectionPermission | GlobalPermission
  docPreferences: DocumentPreferences
  data: Document
  formState: FormState
  user: User
  i18n: I18n
  payload: Payload
  locale?: Locale
  config: SanitizedConfig
}> = (props) => {
  const {
    AfterFields,
    BeforeFields,
    description,
    fieldTypes,
    fields,
    forceSidebarWrap,
    hasSavePermission,
    docPermissions,
    docPreferences,
    data,
    formState,
    user,
    i18n,
    payload,
    locale,
    config,
  } = props

  const mainFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => !field?.admin?.position || field?.admin?.position !== 'sidebar',
    permissions: docPermissions.fields,
    readOnly: !hasSavePermission,
  })

  const sidebarFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => field?.admin?.position === 'sidebar',
    permissions: docPermissions.fields,
    readOnly: !hasSavePermission,
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
                  {/* <ViewDescription description={description} /> */}
                </div>
              )}
            </header>
            {BeforeFields || null}
            <RenderFields
              className={`${baseClass}__fields`}
              fieldTypes={fieldTypes}
              fields={mainFields}
              // permissions={permissions.fields}
              readOnly={!hasSavePermission}
              data={data}
              formState={formState}
              user={user}
              i18n={i18n}
              payload={payload}
              docPreferences={docPreferences}
              config={config}
              locale={locale}
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
                  // permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                  data={data}
                  formState={formState}
                  user={user}
                  i18n={i18n}
                  payload={payload}
                  locale={locale}
                  config={config}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
