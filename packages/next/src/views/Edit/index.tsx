import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  EditViewComponent,
  PayloadServerReactComponent,
} from 'payload'

import React from 'react'

import { EditViewClient } from './index.client.js'

export const EditView: PayloadServerReactComponent<EditViewComponent> = (props) => {
  const { payloadServerAction, routeSegments } = props
  const collectionSlug = routeSegments[0] === 'collections' ? routeSegments[1] : null
  const globalSlug = routeSegments[0] === 'globals' ? routeSegments[1] : null

  return (
    <EditViewClient
      clientCollectionConfig={
        collectionSlug
          ? (payloadServerAction('render-config', {
              collectionSlug,
            }) as unknown as ClientCollectionConfig)
          : null
      }
      clientGlobalConfig={
        globalSlug
          ? (payloadServerAction('render-config', { globalSlug }) as unknown as ClientGlobalConfig)
          : null
      }
      payloadServerAction={payloadServerAction}
    />
  )
}
