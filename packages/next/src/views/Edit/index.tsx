import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  EditViewComponent,
  PayloadServerReactComponent,
} from 'payload'

import React from 'react'

import { EditViewClient } from './index.client.js'

export const EditView: PayloadServerReactComponent<EditViewComponent> = async (props) => {
  const { initPageResult, payloadServerAction, routeSegments } = props
  const collectionSlug = routeSegments[0] === 'collections' ? routeSegments[1] : null
  const globalSlug = routeSegments[0] === 'globals' ? routeSegments[1] : null

  const collectionConfig = collectionSlug
    ? ((await payloadServerAction('render-config', {
        collectionSlug,
        i18n: initPageResult.req.i18n,
      })) as unknown as ClientCollectionConfig)
    : null

  const globalConfig = globalSlug
    ? ((await payloadServerAction('render-config', {
        globalSlug,
        i18n: initPageResult.req.i18n,
      })) as unknown as ClientGlobalConfig)
    : null

  return (
    <EditViewClient
      collectionConfig={collectionConfig}
      globalConfig={globalConfig}
      payloadServerAction={payloadServerAction}
    />
  )
}
