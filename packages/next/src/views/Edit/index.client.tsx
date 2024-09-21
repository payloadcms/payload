'use client'

import type { ClientSideEditViewProps } from 'payload'

import { RenderComponent, SetViewActions } from '@payloadcms/ui'
import React, { Fragment } from 'react'

import { DefaultEditView } from './Default/index.js'

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
