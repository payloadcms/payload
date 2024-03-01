import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import React from 'react'

import type { ActionMap } from './types'

export const mapActions = (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
}): ActionMap => {
  const { collectionConfig, globalConfig } = args

  const views = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit

  const result: ActionMap = {}

  if (views) {
    Object.entries(views).forEach(([key, view]) => {
      if (typeof view === 'object' && 'actions' in view) {
        view.actions.forEach((action) => {
          const Action = action
          if (typeof Action === 'function') {
            result[key] = [...(result[key] || []), <Action />]
          }
        })
      }
    })
  }

  return result
}
