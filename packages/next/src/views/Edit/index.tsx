'use client'

import type { ClientSideEditViewProps } from 'payload'

import { DefaultEditView, RenderComponent, SetViewActions, useEntityConfig } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditView: React.FC<ClientSideEditViewProps> = () => {
  const { collectionConfig, globalConfig } = useEntityConfig()

  const CustomEdit = (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default
    ?.Component

  return (
    <Fragment>
      <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default?.actions
        }
      />
      {CustomEdit ? <RenderComponent mappedComponent={CustomEdit} /> : <DefaultEditView />}
    </Fragment>
  )
}
