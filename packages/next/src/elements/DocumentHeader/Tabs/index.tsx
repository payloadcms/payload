import type { I18n } from '@payloadcms/translations'
import type {
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
import { isPlainObject } from 'payload'
import React from 'react'

import { ShouldRenderTabs } from './ShouldRenderTabs.js'
import { DocumentTab } from './Tab/index.js'
import { getCustomViews } from './getCustomViews.js'
import { getViewConfig } from './getViewConfig.js'
import './index.scss'
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

  return (
    <ShouldRenderTabs>
      <div className={baseClass}>
        <div className={`${baseClass}__tabs-container`}>
          <ul className={`${baseClass}__tabs`}>
            {Object.entries(defaultTabs)
              // sort `defaultViews` based on `order` property from smallest to largest
              // if no `order`, append the view to the end
              // TODO: open `order` to the config and merge `defaultViews` with `customViews`
              ?.sort(([, a], [, b]) => {
                if (a.order === undefined && b.order === undefined) return 0
                else if (a.order === undefined) return 1
                else if (b.order === undefined) return -1
                return a.order - b.order
              })
              ?.map(([name, tab], index) => {
                const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })
                const tabFromConfig = viewConfig && 'Tab' in viewConfig ? viewConfig.Tab : undefined
                const tabConfig = typeof tabFromConfig === 'object' ? tabFromConfig : undefined

                const { condition } = tabConfig || {}

                const meetsCondition =
                  !condition ||
                  (condition &&
                    Boolean(condition({ collectionConfig, config, globalConfig, permissions })))

                if (meetsCondition) {
                  return (
                    <DocumentTab
                      key={`tab-${index}`}
                      {...{
                        ...props,
                        ...(tab || {}),
                        ...(tabFromConfig || {}),
                      }}
                    />
                  )
                }

                return null
              })}
            {customViews?.map((CustomView, index) => {
              if ('Tab' in CustomView) {
                const { Tab, path } = CustomView

                if (typeof Tab === 'object' && !isPlainObject(Tab)) {
                  throw new Error(
                    `Custom 'Tab' Component for path: "${path}" must be a React Server Component. To use client-side functionality, render your Client Component within a Server Component and pass it only props that are serializable. More info: https://react.dev/reference/react/use-server#serializable-parameters-and-return-values`,
                  )
                }

                if (typeof Tab === 'function') {
                  const createMappedComponent = getCreateMappedComponent({
                    importMap: payload.importMap,
                    serverProps: {
                      i18n,
                      payload,
                      permissions,
                      ...props,
                      key: `tab-custom-${index}`,
                      path,
                    },
                  })

                  const mappedTab = createMappedComponent(Tab, undefined, undefined, 'Tab')
                  return (
                    <RenderComponent
                      clientProps={{
                        key: `tab-custom-${index}`,
                        path,
                      }}
                      key={`tab-custom-${index}`}
                      mappedComponent={mappedTab}
                    />
                  )
                }

                return (
                  <DocumentTab
                    key={`tab-custom-${index}`}
                    {...{
                      ...props,
                      ...Tab,
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
