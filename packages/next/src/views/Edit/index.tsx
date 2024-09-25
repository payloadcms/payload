'use client'

import type { ClientSideEditViewProps } from 'payload'

import { DefaultEditView } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditView: React.FC<ClientSideEditViewProps> = ({ Fields }) => {
  // const { collectionConfig, globalConfig } = useEntityConfig()

  return (
    <Fragment>
      {/* <SetViewActions
        actions={
          (collectionConfig || globalConfig)?.admin?.components?.views?.edit?.default?.actions
        }
      /> */}
      <DefaultEditView Fields={Fields} />
    </Fragment>
  )
}
