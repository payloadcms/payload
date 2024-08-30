'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import {
  EditDepthProvider,
  RenderComponent,
  SetViewActions,
  useConfig,
  useDocumentInfo,
} from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const Edit = (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default
    ?.Component

  if (!Edit) {
    return null
  }

  return (
    <Fragment>
      <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default?.actions
        }
      />
      <EditDepthProvider depth={0}>
        <RenderComponent mappedComponent={Edit} />
      </EditDepthProvider>
    </Fragment>
  )
}
