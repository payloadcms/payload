'use client'

import type { ClientSideEditViewProps } from 'payload'

import { DefaultEditView, RenderComponent, SetViewActions } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC<ClientSideEditViewProps> = (props) => {
  const { collectionConfig, globalConfig } = props

  const CustomEdit = (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default
    ?.Component

  return (
    <Fragment>
      <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default?.actions
        }
      />
      {CustomEdit ? (
        <RenderComponent clientProps={props} mappedComponent={CustomEdit} />
      ) : (
        <DefaultEditView {...props} />
      )}
    </Fragment>
  )
}
