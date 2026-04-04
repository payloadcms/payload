import type {
  ComponentRenderer,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import React from 'react'

import { Gutter } from '../Gutter/index.js'
import { RenderTitle } from '../RenderTitle/index.js'
import { DocumentTabs } from './Tabs/index.js'
import './index.scss'

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
  renderComponent?: ComponentRenderer
  req: PayloadRequest
}> = (props) => {
  const {
    AfterHeader,
    collectionConfig,
    globalConfig,
    hideTabs,
    permissions,
    renderComponent,
    req,
  } = props

  return (
    <Gutter className={baseClass}>
      <div className={`${baseClass}__header`}>
        <RenderTitle className={`${baseClass}__title`} />
        {!hideTabs && (
          <DocumentTabs
            collectionConfig={collectionConfig}
            globalConfig={globalConfig}
            permissions={permissions}
            renderComponent={renderComponent}
            req={req}
          />
        )}
      </div>
      {AfterHeader ? <div className={`${baseClass}__after-header`}>{AfterHeader}</div> : null}
    </Gutter>
  )
}
