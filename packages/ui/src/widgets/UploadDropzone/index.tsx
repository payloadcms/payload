import type { WidgetServerProps } from 'payload'

import { getAccessResults } from 'payload'
import React from 'react'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference the client bundle.
import { UploadDropzoneWidgetClient } from '../../exports/client/index.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'

export async function UploadDropzoneWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: { collection?: string } }>) {
  if (!req.user) {
    return null
  }
  const collectionSlug = widgetData?.collection
  const collection = req.payload.collections[collectionSlug]?.config
  const permissions = await getAccessResults({ req })
  if (
    !collection?.upload ||
    collection.upload.bulkUpload === false ||
    !getVisibleEntities({ req }).collections.includes(collectionSlug) ||
    !permissions.collections?.[collectionSlug]?.create ||
    !permissions.canAccessAdmin
  ) {
    return null
  }
  return (
    <UploadDropzoneWidgetClient
      collectionSlug={collectionSlug}
      mimeTypes={collection.upload.mimeTypes}
    />
  )
}
