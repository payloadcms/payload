import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import React from 'react'

import type { WithServerSidePropsPrePopulated } from './index.js'
import type { ActionMap } from './types.js'

export const mapActions = (args: {
  WithServerSideProps: WithServerSidePropsPrePopulated
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
}): ActionMap => {
  const { WithServerSideProps, collectionConfig, globalConfig } = args

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
            result.Edit[key] = [...(result[key] || []), <WithServerSideProps Component={Action} />]
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
        result.List = [...result.List, <WithServerSideProps Component={Action} />]
      }
    })
  }

  return result
}
