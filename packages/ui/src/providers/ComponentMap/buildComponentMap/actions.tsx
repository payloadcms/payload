import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import React from 'react'

import type { ActionMap } from './types.js'

export const mapActions = (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
}): ActionMap => {
  const { collectionConfig, globalConfig } = args

  const editViews = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit

  const listActions =
    typeof collectionConfig?.admin?.components?.views?.List === 'object'
      ? collectionConfig?.admin?.components?.views?.List?.actions
      : undefined

  const result: ActionMap = {
    Edit: {},
    List: [],
  }

  if (editViews) {
    Object.entries(editViews).forEach(([key, view]) => {
      if (typeof view === 'object' && 'actions' in view) {
        view.actions.forEach((action) => {
          const Action = action
          if (typeof Action === 'function') {
            result.Edit[key] = [...(result[key] || []), <Action />]
          }
        })
      }
    })
  }

  if (listActions) {
    listActions.forEach((action) => {
      const Action = action
      if (typeof Action === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        result.List = [...result.List, <Action />]
      }
    })
  }

  return result
}
