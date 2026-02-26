import type {
  DocumentTabClientProps,
  DocumentTabServerPropsOnly,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DefaultDocumentTab } from './Tab/index.js'
import { getTabs } from './tabs/index.js'
import './index.scss'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  permissions: SanitizedPermissions
  req: PayloadRequest
}> = ({ collectionConfig, globalConfig, permissions, req }) => {
  const { config } = req.payload

  const tabs = getTabs({
    collectionConfig,
    globalConfig,
  })

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {tabs?.map(({ tab: tabConfig, viewPath }, index) => {
              const { condition } = tabConfig || {}

              const meetsCondition =
                !condition ||
                condition({ collectionConfig, config, globalConfig, permissions, req })

              if (!meetsCondition) {
                return null
              }

              if (tabConfig?.Component) {
                return RenderServerComponent({
                  clientProps: {
                    path: viewPath,
                  } satisfies DocumentTabClientProps,
                  Component: tabConfig.Component,
                  key: `tab-${index}`,
                  serverProps: {
                    collectionConfig,
                    globalConfig,
                    i18n: req.i18n,
                    payload: req.payload,
                    permissions,
                    req,
                    user: req.user,
                  } satisfies DocumentTabServerPropsOnly,
                })
              }

              return (
                <DefaultDocumentTab
                  collectionConfig={collectionConfig}
                  globalConfig={globalConfig}
                  key={`tab-${index}`}
                  path={viewPath}
                  permissions={permissions}
                  req={req}
                  tabConfig={tabConfig}
                />
              )
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
