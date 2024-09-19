import type { I18n } from '@payloadcms/translations'
import type {
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { getCreateMappedComponent, RenderComponent } from '@payloadcms/ui/shared'
import React from 'react'

import { getCustomViews } from './getCustomViews.js'
import './index.scss'
import { mergeTabViews } from './mergeTabViews.js'
import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DocumentTab } from './Tab/index.js'
import { tabs as defaultTabs } from './tabs/index.js'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  i18n: I18n
  payload: Payload
  permissions: Permissions
}> = (props) => {
  const { collectionConfig, globalConfig, i18n, payload, permissions } = props
  const { config } = payload

  const customViews = getCustomViews({ collectionConfig, globalConfig })

  const mergedTabViews = mergeTabViews(
    defaultTabs,
    customViews,
    collectionConfig,
    globalConfig,
    config,
    permissions,
  )

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {mergedTabViews.map((mergedTabView) => {
              if (!mergedTabView.isDefault && mergedTabView.Component) {
                const createMappedComponent = getCreateMappedComponent({
                  importMap: payload.importMap,
                  serverProps: {
                    i18n,
                    payload,
                    permissions,
                    ...props,
                    key: `tab-custom-${mergedTabView.index}`,
                    path: mergedTabView.path,
                  },
                })
                const mappedTab = createMappedComponent(
                  mergedTabView.Component,
                  undefined,
                  undefined,
                  'tab.Component',
                )
                return (
                  <RenderComponent
                    clientProps={{
                      key: `tab-custom-${mergedTabView.index}`,
                      path: mergedTabView.path,
                    }}
                    key={`tab-custom-${mergedTabView.index}`}
                    mappedComponent={mappedTab}
                  />
                )
              } else if (!mergedTabView.isDefault) {
                return (
                  <DocumentTab
                    key={`tab-custom-${mergedTabView.index}`}
                    {...{
                      ...props,
                      ...mergedTabView.tab,
                    }}
                  />
                )
              } else if (mergedTabView.isDefault) {
                return (
                  <DocumentTab
                    key={`tab-default-${mergedTabView.index}`}
                    {...{
                      ...props,
                      ...(mergedTabView.tab || {}),
                      ...(mergedTabView.tabFromConfig || {}),
                    }}
                  />
                )
              }
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
