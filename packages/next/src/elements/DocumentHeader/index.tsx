import type { I18n } from '@payloadcms/translations'
import type {
  Payload,
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
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  i18n: I18n
  payload: Payload
  permissions: SanitizedPermissions
}> = (props) => {
  const { collectionConfig, globalConfig, hideTabs, i18n, payload, permissions } = props

  return (
    <Gutter className={baseClass}>
      <RenderTitle className={`${baseClass}__title`} />
      {!hideTabs && (
        <DocumentTabs
          collectionConfig={collectionConfig}
          globalConfig={globalConfig}
          i18n={i18n}
          payload={payload}
          permissions={permissions}
        />
      )}
    </Gutter>
  )
}
