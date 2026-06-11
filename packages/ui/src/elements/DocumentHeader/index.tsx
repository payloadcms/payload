import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { Gutter, RenderTitle } from '../../exports/client/index.js'
import { DocumentTabs } from './Tabs/index.js'
import './index.css'

const baseClass = `doc-header`

/**
 * @internal
 */
export const DocumentHeader: React.FC<{
  AfterHeader?: React.ReactNode
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  permissions: SanitizedPermissions
  req: PayloadRequest
}> = (props) => {
  const { AfterHeader, collectionConfig, globalConfig, hideTabs, permissions, req } = props

  return (
    <div className={baseClass}>
      <RenderTitle className={`${baseClass}__title`} />
      {!hideTabs && (
        <DocumentTabs
          collectionConfig={collectionConfig}
          globalConfig={globalConfig}
          permissions={permissions}
          req={req}
        />
      )}
      {AfterHeader ? <div className={`${baseClass}__after-header`}>{AfterHeader}</div> : null}
    </div>
  )
}
