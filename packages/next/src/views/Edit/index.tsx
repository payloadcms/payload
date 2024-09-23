'use client'

import type { ClientSideEditViewProps } from 'payload'

import { EditView as EditViewHandler, SetViewActions, useEntityConfig } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditView: React.FC<ClientSideEditViewProps> = () => {
  const { collectionConfig, globalConfig } = useEntityConfig()

  return (
    <Fragment>
      <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default?.actions
        }
      />
      <EditViewHandler />
    </Fragment>
  )
}
