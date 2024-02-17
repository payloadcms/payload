import React from 'react'

import { DocumentTab } from './Tab'
import { getCustomViews } from './getCustomViews'
import { getViewConfig } from './getViewConfig'
import { tabs as defaultTabs } from './tabs'
import { ShouldRenderTabs } from './ShouldRenderTabs'
import { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'
import { I18n } from '@payloadcms/translations'

import './index.scss'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  globalConfig: SanitizedGlobalConfig
  i18n: I18n
}> = (props) => {
  const { collectionConfig, globalConfig, config } = props

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
                  condition || (condition && condition({ collectionConfig, config, globalConfig }))

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

                if (typeof Tab === 'function') {
                  return <Tab path={path} {...props} key={`tab-custom-${index}`} />
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
