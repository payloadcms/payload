import type { CollectionSlug, WidgetServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { UploadDropzoneWidgetClient } from '../../exports/client/index.js'
import '../../elements/Card/index.css'
import './index.css'

type UploadDropzoneWidgetData = {
  collection?: CollectionSlug
}

export function UploadDropzoneWidget({
  permissions,
  req,
  widgetData,
}: WidgetServerProps<{ data?: UploadDropzoneWidgetData }>) {
  const { i18n, payload } = req
  const collectionSlug = widgetData?.collection
  const collection = collectionSlug ? payload.collections[collectionSlug]?.config : undefined
  const isUploadCollection = Boolean(collection?.upload && collection.upload.bulkUpload)
  const title = i18n.t('dashboard:widgetUploadFiles')

  if (!collectionSlug || !isUploadCollection) {
    return (
      <section aria-label={title} className="card upload-dropzone-widget">
        <p className="upload-dropzone-widget__message">
          {collectionSlug
            ? i18n.t('dashboard:widgetInvalidCollection', { collection: collectionSlug })
            : i18n.t('dashboard:widgetCollectionRequired')}
        </p>
      </section>
    )
  }

  if (!permissions?.collections?.[collectionSlug]?.create) {
    return (
      <section aria-label={title} className="card upload-dropzone-widget">
        <p className="upload-dropzone-widget__message">
          {i18n.t('error:notAllowedToPerformAction')}
        </p>
      </section>
    )
  }

  return (
    <section aria-label={title} className="card upload-dropzone-widget">
      <UploadDropzoneWidgetClient
        collectionSlug={collectionSlug}
        mimeTypes={collection.upload.mimeTypes}
      />
    </section>
  )
}
