import type { I18n } from '@payloadcms/translations'
import type {
  Data,
  Payload,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  TypedUser,
} from 'payload'

import { Gutter, RenderTitle } from '@payloadcms/ui'
import React from 'react'

import './index.scss'
import { DocumentTabs } from './Tabs/index.js'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  doc: Data
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  i18n: I18n
  payload: Payload
  permissions: SanitizedPermissions
  user?: TypedUser
}> = (props) => {
  const { collectionConfig, doc, globalConfig, hideTabs, i18n, payload, permissions, user } = props

  return (
    <Gutter className={baseClass}>
      <RenderTitle className={`${baseClass}__title`} />
      {!hideTabs && (
        <DocumentTabs
          collectionConfig={collectionConfig}
          doc={doc}
          globalConfig={globalConfig}
          i18n={i18n}
          payload={payload}
          permissions={permissions}
          user={user}
        />
      )}
    </Gutter>
  )
}
