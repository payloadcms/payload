import type { PayloadRequest, SanitizedCollectionConfig, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { DocumentLayout } from '../../elements/LayoutToggle/index.js'
import type { CollectionPreviewDocument } from './types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference client exports for the production boundary
import { CollectionPreviewClient } from '../../exports/client/index.js'
import { formatRelativeDate, getRelativeTimeFormat } from '../../utilities/formatRelativeDate.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { isNavEntityVisible } from '../../utilities/isNavEntityVisible.js'
import { getValueByPath } from '../Activity/utils/documents.js'
import { getPreviewThumbnailURLs } from './getPreviewThumbnailURLs.js'
import { getCollectionPreviewLayout, getCollectionPreviewPreferenceKey } from './preferences.js'
import { renderCollectionPreviewTable } from './renderTable.js'

type CollectionPreviewData = { relatedCollection?: string }

export async function CollectionPreviewWidget({
  permissions,
  req,
  widgetData,
  widgetId,
}: WidgetServerProps<{ data?: CollectionPreviewData }>) {
  const { i18n, payload, user } = req
  const collectionSlug = widgetData?.relatedCollection
  const collection = collectionSlug ? payload.collections[collectionSlug]?.config : undefined

  if (
    !user ||
    !collection ||
    !getVisibleEntities({ req }).collections.includes(collectionSlug) ||
    !isNavEntityVisible({
      adminGroup: collection.admin.group,
      entityPermissions: permissions?.collections?.[collectionSlug],
    })
  ) {
    return null
  }

  const { useAsTitle: titleField = 'id' } = collection.admin
  const { admin } = payload.config.routes
  const href = formatAdminURL({ adminRoute: admin, path: `/collections/${collectionSlug}` })
  const label = getTranslation(collection.labels.plural, i18n)
  const description =
    typeof collection.admin.description === 'function'
      ? collection.admin.description({ t: i18n.t })
      : collection.admin.description
  const isBulkUploadEnabled = Boolean(
    collection.upload &&
    collection.upload.bulkUpload !== false &&
    !collection.upload.hideFileInputOnCreate,
  )
  const relativeTimeFormat = getRelativeTimeFormat(i18n.language)
  let documents: CollectionPreviewDocument[] = []
  let loadError: string | undefined
  let table: React.ReactNode

  try {
    const result = await getPreviewDocuments({ collection, req })
    const thumbnailURLs = await getPreviewThumbnailURLs({ collection, docs: result.docs, req })

    table = renderCollectionPreviewTable({
      collection,
      docs: result.docs,
      fieldPermissions: permissions?.collections?.[collectionSlug]?.fields,
      label,
      req,
      thumbnailURLs,
    })

    documents = result.docs.map((doc) => {
      const rawTitle = getValueByPath({ object: doc, path: titleField })
      const updatedAt = typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined

      return {
        id: doc.id,
        dateLabel: updatedAt
          ? formatRelativeDate({ relativeTimeFormat, value: updatedAt })
          : undefined,
        dateTime: updatedAt,
        href: formatAdminURL({
          adminRoute: admin,
          path: `/collections/${collectionSlug}/${encodeURIComponent(String(doc.id))}`,
        }),
        thumbnailURL: thumbnailURLs.get(doc.id),
        title:
          typeof rawTitle === 'string' || typeof rawTitle === 'number'
            ? String(rawTitle)
            : String(doc.id),
      }
    })
  } catch (err) {
    payload.logger.error({
      err,
      msg: `CollectionPreviewWidget: failed to query "${collectionSlug}"`,
    })
    loadError = i18n.t('dashboard:widgetQueryError')
  }

  let initialLayout: DocumentLayout = 'grid'

  try {
    const preferences = await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      select: { value: true },
      user,
      where: { key: { equals: getCollectionPreviewPreferenceKey({ collectionSlug, widgetId }) } },
    })
    initialLayout = getCollectionPreviewLayout({ value: preferences.docs[0]?.value })
  } catch (err) {
    payload.logger.error({
      err,
      msg: `CollectionPreviewWidget: failed to load display preference for "${collectionSlug}"`,
    })
  }

  return (
    <CollectionPreviewClient
      collectionSlug={collectionSlug}
      createHref={
        permissions?.collections?.[collectionSlug]?.create
          ? formatAdminURL({ adminRoute: admin, path: `/collections/${collectionSlug}/create` })
          : undefined
      }
      createLabel={
        isBulkUploadEnabled
          ? i18n.t('upload:addFiles')
          : i18n.t('general:createNewLabel', { label: '' }).trim()
      }
      description={getTranslation(description, i18n)}
      documents={documents}
      emptyLabel={i18n.t('version:noRowsFound', { label })}
      href={href}
      initialLayout={initialLayout}
      isAuth={Boolean(collection.auth)}
      isBulkUploadEnabled={isBulkUploadEnabled}
      label={label}
      loadError={loadError}
      mimeTypes={collection.upload ? collection.upload.mimeTypes : undefined}
      table={table}
      widgetId={widgetId}
    />
  )
}

async function getPreviewDocuments({
  collection,
  req,
}: {
  collection: SanitizedCollectionConfig
  req: PayloadRequest
}) {
  const limit = 8
  const sort = collection.timestamps ? '-updatedAt' : '-id'
  const baseFilter = collection.admin.baseFilter ?? collection.admin.baseListFilter
  const where = await baseFilter?.({ limit, locale: req.locale, page: 1, req, sort })

  return req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit,
    overrideAccess: false,
    pagination: false,
    req,
    sort,
    user: req.user,
    where: where ?? undefined,
  })
}
