'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import { RenderComponent, SetViewActions, useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig
  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const Edit = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit?.Default
    ?.Component

  if (!Edit) {
    return null
  }

  return (
    <Fragment>
      <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.Edit?.Default?.actions
        }
      />
      <RenderComponent mappedComponent={Edit} />
    </Fragment>
  )
}
