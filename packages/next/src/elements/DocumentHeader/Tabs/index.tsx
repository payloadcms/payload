import type { I18n } from '@payloadcms/translations'
import type {
  DocumentTabClientProps,
  DocumentTabConfig,
  DocumentTabServerPropsOnly,
  Payload,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { getCustomViews } from './getCustomViews.js'
import { getViewConfig } from './getViewConfig.js'
import './index.scss'
import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DocumentTab } from './Tab/index.js'
import { tabs } from './tabs/index.js'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  i18n: I18n
  payload: Payload
  permissions: SanitizedPermissions
}> = (props) => {
  const { collectionConfig, globalConfig, i18n, payload, permissions } = props
  const { config } = payload

  const customViews = getCustomViews({ collectionConfig, globalConfig })

  const defaultTabs = tabs(collectionConfig, globalConfig)

  const combinedTabs = [
    ...Object.entries(defaultTabs).map(([name, tab]) => {
      return {
        type: 'default',
        config: { name, tab },
        order: tab.order ?? Infinity,
      }
    }),

    ...customViews.map((CustomView) => {
      if ('tab' in CustomView) {
        return {
          type: 'custom',
          config: CustomView,
          order: (CustomView.tab.order && CustomView.tab.order) ?? Infinity,
        }
      }
      return null
    }),
  ].sort((a, b) => a.order - b.order)

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {combinedTabs.map((tab, index) => {
              if (tab.type === 'default') {
                const { name, tab: tabConfig } = tab.config as {
                  name: string
                  tab: DocumentTabConfig
                }
                const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })
                const tabFromConfig = viewConfig && 'tab' in viewConfig ? viewConfig.tab : undefined

                const { condition } = tabFromConfig || {}

                const meetsCondition =
                  !condition ||
                  (condition &&
                    Boolean(condition({ collectionConfig, config, globalConfig, permissions })))
                if (meetsCondition) {
                  return (
                    <DocumentTab
                      key={`tab-${index}`}
                      path={viewConfig && 'path' in viewConfig ? viewConfig.path : ''}
                      {...{
                        ...props,
                        ...(tabConfig || {}),
                        ...(tabFromConfig || {}),
                      }}
                    />
                  )
                }

                return null
              }

              if (tab.type === 'custom') {
                const { path, tab: tabConfig } = tab.config as {
                  path: string
                  tab: DocumentTabConfig
                }

                if (tabConfig.Component) {
                  return RenderServerComponent({
                    clientProps: {
                      path,
                    } satisfies DocumentTabClientProps,
                    Component: tabConfig.Component,
                    importMap: payload.importMap,
                    key: `tab-custom-${index}`,
                    serverProps: {
                      collectionConfig,
                      globalConfig,
                      i18n,
                      payload,
                      permissions,
                    } satisfies DocumentTabServerPropsOnly,
                  })
                }

                return (
                  <DocumentTab
                    key={`tab-custom-${index}`}
                    path={path}
                    {...{
                      ...props,
                      ...tabConfig,
                    }}
                  />
                )
              }
              return null
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
