'use client'

import { LoadingOverlay, SetViewActions, useComponentMap, useDocumentInfo } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { getComponentMap } = useComponentMap()

  const { Edit, actionsMap } = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  // Allow the `DocumentInfoProvider` to hydrate
  if (!Edit || (!collectionSlug && !globalSlug)) {
    return <LoadingOverlay />
  }

  return (
    <Fragment>
      <SetViewActions actions={actionsMap?.Edit?.Default} />
      {Edit}
    </Fragment>
  )
}
