import type { I18n } from '@payloadcms/translations'
import type {
  Permissions,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { Gutter, RenderTitle } from '@payloadcms/ui/client'
import React, { Fragment } from 'react'

import { DocumentTabs } from './Tabs/index.js'
import './index.scss'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  customHeader?: React.ReactNode
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  i18n: I18n
  permissions: Permissions
}> = (props) => {
  const { collectionConfig, config, customHeader, globalConfig, hideTabs, i18n, permissions } =
    props

  return (
    <Gutter className={baseClass}>
      {customHeader && customHeader}
      {!customHeader && (
        <Fragment>
          <RenderTitle className={`${baseClass}__title`} />
          {!hideTabs && (
            <DocumentTabs
              collectionConfig={collectionConfig}
              config={config}
              globalConfig={globalConfig}
              i18n={i18n}
              permissions={permissions}
            />
          )}
        </Fragment>
      )}
    </Gutter>
  )
}
