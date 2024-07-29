'use client'

import {
  RenderMappedComponent,
  SetViewActions,
  useComponentMap,
  useDocumentInfo,
} from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { getComponentMap } = useComponentMap()

  const { Edit, actionsMap } = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  if (!Edit?.Component) {
    return null
  }

  return (
    <Fragment>
      <SetViewActions actions={actionsMap?.Edit?.Default} />
      <RenderMappedComponent component={Edit} />
    </Fragment>
  )
}
