import type {
  ComponentImportMap,
  EditConfig,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import React from 'react'

import type { WithServerSidePropsPrePopulated } from './index.js'
import type { ActionMap } from './types.js'

import { getComponent } from './getComponent.js'

export const mapActions = (args: {
  WithServerSideProps: WithServerSidePropsPrePopulated
  collectionConfig?: SanitizedCollectionConfig
  componentImportMap: ComponentImportMap
  globalConfig?: SanitizedGlobalConfig
}): ActionMap => {
  const { WithServerSideProps, collectionConfig, globalConfig } = args

  const editViews: EditConfig = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit

  const listActions =
    typeof collectionConfig?.admin?.components?.views?.List === 'object'
      ? collectionConfig?.admin?.components?.views?.List?.actions
      : undefined

  const result: ActionMap = {
    Edit: {},
    List: [],
  }

  if (editViews) {
    for (const [key, view] of Object.entries(editViews)) {
      if (!('actions' in view)) {
        continue
      }
      view.actions.forEach((action, i) => {
        const ResolvedAction = getComponent({
          componentImportMap: args.componentImportMap,
          payloadComponent: action,
        })
        if (ResolvedAction?.component) {
          if (!result.Edit[key]) {
            result.Edit[key] = []
          }
          result.Edit[key].push(<WithServerSideProps Component={ResolvedAction} key={i} />)
        }
      })
    }
  }

  if (listActions) {
    listActions.forEach((action, i) => {
      const ResolvedAction = getComponent({
        componentImportMap: args.componentImportMap,
        payloadComponent: action,
      })
      if (ResolvedAction?.component) {
        result.List.push(<WithServerSideProps Component={ResolvedAction} key={i} />)
      }
    })
  }

  return result
}
