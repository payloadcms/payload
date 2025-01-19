'use client'

import type { ClientCollectionConfig, DefaultCellComponentProps } from 'payload'

import type { InitialDefaultCellComponentProps } from './RenderDefaultCell/index.js'

import { useConfig } from '../../providers/Config/index.js'

/**
 * HOC to ensure that cell components get the CollectionConfig as an arg, and to ensure that the
 * CollectionConfig is fetched on the client (here) intead of passed from the server. This reduces
 * the amount of data that needs to be passed from the server to the client.
 *
 * @todo remove this in 4.0. Only pass the collectionSlug to the client cell. The client cell is then
 * responsible for fetching the collection config using useConfig if needed.
 */
export const RenderWithCollectionConfig: React.FC<{
  clientProps: InitialDefaultCellComponentProps
  Component: React.ComponentType<any>
}> = ({ clientProps, Component }) => {
  const { getEntityConfig } = useConfig()

  const propsToPass: DefaultCellComponentProps = {
    ...clientProps,
    collectionConfig: getEntityConfig({
      collectionSlug: clientProps.collectionSlug,
    }) as ClientCollectionConfig,
  }
  // @ts-expect-error - part of propsToPass as we're spreading clientProps
  delete propsToPass.collectionSlug

  return <Component {...propsToPass} />
}
