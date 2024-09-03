import type { I18n } from '@payloadcms/translations'
import type {
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { Gutter, RenderTitle } from '@payloadcms/ui'
import React, { Fragment } from 'react'

import './index.scss'
import { DocumentTabs } from './Tabs/index.js'

const baseClass = `doc-header`

export const DocumentHeader: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  globalConfig?: SanitizedGlobalConfig
  hideTabs?: boolean
  i18n: I18n
  payload: Payload
  permissions: Permissions
}> = (props) => {
  const { collectionConfig, customHeader, globalConfig, hideTabs, i18n, payload, permissions } =
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
              globalConfig={globalConfig}
              i18n={i18n}
              payload={payload}
              permissions={permissions}
            />
          )}
        </Fragment>
      )}
    </Gutter>
  )
}
