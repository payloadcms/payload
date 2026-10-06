import type { CollectionSlug, WidgetServerProps } from 'payload'

import { isEntityHidden } from 'payload'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { UploadDropzoneWidgetClient } from '../../../exports/client/index.js'
import '../../../shared/elements/Card/index.css'
import './index.css'

type UploadDropzoneWidgetData = {
  excludedCollections?: CollectionSlug[]
}

export function UploadDropzoneWidget({
  permissions,
  req,
  widgetData,
}: WidgetServerProps<{ data?: UploadDropzoneWidgetData }>) {
  const { i18n, payload } = req
  const uploadCollections = Object.values(payload.collections)
    .map(({ config }) => config)
    .filter(
      (collection) =>
        collection.upload &&
        collection.upload.bulkUpload !== false &&
        !isEntityHidden({ hidden: collection.admin?.hidden, user: req.user }),
    )
  const excludedCollections = new Set(widgetData?.excludedCollections ?? [])
  const selectedCollections = uploadCollections.filter(
    (collection) => !excludedCollections.has(collection.slug),
  )
  const permittedCollections = selectedCollections.filter(
    (collection) => permissions?.collections?.[collection.slug]?.create,
  )
  const title = i18n.t('dashboard:widgetUploadFiles')

  if (!selectedCollections.length) {
    return (
      <section aria-label={title} className="card upload-dropzone-widget">
        <p className="upload-dropzone-widget__message">
          {i18n.t('dashboard:widgetCollectionRequired')}
        </p>
      </section>
    )
  }

  if (!permittedCollections.length) {
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
        collections={permittedCollections.map((collection) => ({
          slug: collection.slug,
          mimeTypes: collection.upload.mimeTypes,
        }))}
      />
    </section>
  )
}
