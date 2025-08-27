import type { I18n } from '@payloadcms/translations'
import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import { Gutter, RenderTitle } from '@payloadcms/ui'
import React from 'react'

import { DocumentTabs } from './Tabs/index.js'
import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  permissions: SanitizedPermissions
  req: PayloadRequest
}> = (props) => {
  const { collectionConfig, globalConfig, hideTabs, permissions, req } = props

  return (
    <Gutter className={baseClass}>
      <RenderTitle className={`${baseClass}__title`} />
      {!hideTabs && (
        <DocumentTabs
          collectionConfig={collectionConfig}
          globalConfig={globalConfig}
          permissions={permissions}
          req={req}
        />
      )}
    </Gutter>
  )
}
