'use client'

import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import React, { Fragment } from 'react'

export const EditViewClient: React.FC = () => {
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { getComponentMap } = useComponentMap()

  const { Edit, actionsMap } = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  if (!Edit) {
    return null
  }

  return (
    <Fragment>
      <SetViewActions actions={actionsMap?.Edit?.Default} />
      {Edit}
    </Fragment>
  )
}
