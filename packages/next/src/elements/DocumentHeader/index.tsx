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
  Description?: React.ReactNode
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  permissions: SanitizedPermissions
  req: PayloadRequest
}> = (props) => {
  const { collectionConfig, Description, globalConfig, hideTabs, permissions, req } = props

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__header`}>
        <RenderTitle className={`${baseClass}__title`} />
        {!hideTabs && (
          <DocumentTabs
            collectionConfig={collectionConfig}
            globalConfig={globalConfig}
            permissions={permissions}
            req={req}
          />
        )}
      </div>
      {Description ? <div className={`${baseClass}__description`}>{Description}</div> : null}
    </Gutter>
  )
}
