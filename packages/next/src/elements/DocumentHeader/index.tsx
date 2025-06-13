import type { I18n } from '@payloadcms/translations'
import type {
  Data,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
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
  req?: PayloadRequest
}> = (props) => {
  const { collectionConfig, doc, globalConfig, hideTabs, i18n, payload, permissions, req } = props

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
          req={req}
        />
      )}
    </Gutter>
  )
}
