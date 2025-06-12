import type { I18n } from '@payloadcms/translations'
import type {
  DocumentTabClientProps,
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

    ...customViews.map((customViewConfig) => {
      if ('tab' in customViewConfig) {
        return {
          type: 'custom',
          config: customViewConfig,
          order: (customViewConfig.tab.order && customViewConfig.tab.order) ?? Infinity,
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
                if ('name' in tab.config && 'tab' in tab.config) {
                  const { name, tab: tabConfig } = tab.config
                  const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })
                  const tabFromConfig =
                    viewConfig && 'tab' in viewConfig ? viewConfig.tab : undefined

                  const { condition } = tabFromConfig || {}

                  const meetsCondition =
                    !condition ||
                    (condition &&
                      Boolean(condition({ collectionConfig, config, globalConfig, permissions })))

                  const path = viewConfig && 'path' in viewConfig ? viewConfig.path : ''

                  if (meetsCondition) {
                    if (tabFromConfig?.Component) {
                      return RenderServerComponent({
                        clientProps: {
                          path,
                        } satisfies DocumentTabClientProps,
                        Component: tabFromConfig.Component,
                        importMap: payload.importMap,
                        key: `tab-${index}`,
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
                        key={`tab-${index}`}
                        path={path}
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
                return null
              }

              if (tab.type === 'custom') {
                if ('tab' in tab.config) {
                  const { tab: tabConfig } = tab.config

                  const path = 'path' in tab.config ? tab.config.path : ''

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
              }
              return null
            })}
          </ul>
        </div>
      </div>
    </ShouldRenderTabs>
  )
}
