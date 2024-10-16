import type {
  DocumentTabComponent,
  DocumentTabConfig,
  EditViewConfig,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedConfig,
 SanitizedGlobalConfig } from 'payload'

import { getViewConfig } from './getViewConfig.js'

export type MergedTabView = {
  Component: DocumentTabComponent | null
  index: number
  isDefault: boolean
  order: number
  path: string
  tab: DocumentTabConfig
  tabFromConfig: DocumentTabConfig
}

export const mergeTabViews = (
  defaultTabs: Record<string, DocumentTabConfig>,
  customViews: EditViewConfig[],
  collectionConfig: SanitizedCollectionConfig,
  globalConfig: SanitizedGlobalConfig,
  config: SanitizedConfig,
  permissions: Permissions,
): MergedTabView[] => {
  const mergedTabViews: MergedTabView[] = [
    ...Object.entries(defaultTabs).map(([name, tab], index) => {
      const viewConfig = getViewConfig({ name, collectionConfig, globalConfig })
      const tabFromConfig = viewConfig && 'tab' in viewConfig ? viewConfig.tab : undefined
      const orderFromConfig =
        viewConfig && 'tab' in viewConfig && 'order' in viewConfig.tab
          ? viewConfig?.tab?.order
          : tab.order
      const { condition } = tabFromConfig || {}
      const meetsCondition =
        !condition ||
        (condition && Boolean(condition({ collectionConfig, config, globalConfig, permissions })))

      if (meetsCondition) {
        return {
          Component: null,
          index,
          isDefault: true,
          order: orderFromConfig,
          path: null,
          tab,
          tabFromConfig,
        }
      } else {
        return null
      }
    }),
    ...customViews.map((CustomView, index) => {
      if ('tab' in CustomView) {
        const { path, tab } = CustomView

        return {
          Component: tab.Component,
          index,
          isDefault: false,
          order: tab.order,
          path,
          tab,
          tabFromConfig: null,
        }
      } else {
        return null
      }
    }),
  ]

  mergedTabViews.forEach((view) => {
    if (!view.order) {
      view.order = undefined
    }
  })

  return mergedTabViews.sort((a, b) => {
    if (a.order === undefined && b.order === undefined) {
      return 0
    } else if (a.order === undefined) {
      return 1
    } else if (b.order === undefined) {
      return -1
    }
    return a.order - b.order
  })
}
