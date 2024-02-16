import React, { Fragment } from 'react'

import { DocumentTab } from './Tab'
import { getCustomViews } from './getCustomViews'
import { getViewConfig } from './getViewConfig'
import { tabs as defaultTabs } from './tabs'
import { DocumentTabProps } from 'payload/types'
import { ShouldRenderTabs } from './ShouldRenderTabs'

import './index.scss'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<DocumentTabProps> = (props) => {
  const { collectionConfig, globalConfig } = props

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
                const DefaultTab = tab.Tab
                const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })
                const tabFromConfig = viewConfig && 'Tab' in viewConfig ? viewConfig.Tab : undefined

                let CustomTab =
                  typeof tabFromConfig === 'object' && typeof tabFromConfig.Tab === 'function'
                    ? tabFromConfig.Tab
                    : undefined

                const TabComponent = CustomTab || DefaultTab

                if (!TabComponent) return null

                return (
                  <TabComponent
                    {...{
                      ...props,
                      ...(tab || {}),
                      ...(tabFromConfig || {}),
                    }}
                    key={`tab-${index}`}
                  />
                )
              })}
            {customViews?.map((CustomView, index) => {
              if ('Tab' in CustomView) {
                const { Tab, path } = CustomView

                if (typeof Tab === 'function') {
                  return <Tab path={path} {...props} key={`tab-custom-${index}`} />
                }

                return (
                  <DocumentTab
                    {...{
                      ...props,
                      ...Tab,
                    }}
                    key={`tab-custom-${index}`}
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
