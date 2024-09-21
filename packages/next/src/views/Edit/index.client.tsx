'use client'

import type { ClientSideEditViewProps } from 'payload'

import { RenderComponent, SetViewActions } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC<ClientSideEditViewProps> = (props) => {
  const { clientCollectionConfig, clientGlobalConfig } = props

  const Edit = (clientCollectionConfig || clientGlobalConfig)?.admin?.components?.views?.edit
    ?.default?.Component

  if (!Edit) {
    return null
  }

  return (
    <Fragment>
      <SetViewActions
        actions={
          (clientCollectionConfig || clientGlobalConfig)?.admin?.components?.views?.edit?.default
            ?.actions
        }
      />
      {/* <RenderComponent clientProps={props} mappedComponent={Edit} /> */}
      hello, world!
    </Fragment>
  )
}
