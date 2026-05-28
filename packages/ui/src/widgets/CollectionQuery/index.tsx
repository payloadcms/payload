import type { CollectionSlug, Where, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import '../../elements/Card/index.css'
import './index.css'

type CollectionQueryWidgetData = {
  limit?: number
  relatedCollection?: CollectionSlug
  sortDirection?: 'asc' | 'desc'
  sortField?: string
  title?: string
  where?: Where
}

type QueryDoc = {
  createdAt?: string
  id: number | string
  updatedAt?: string
} & Record<string, unknown>

export async function CollectionQueryWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: CollectionQueryWidgetData }>) {
  const { payload, user } = req
  const {
    relatedCollection,
    sortDirection = 'desc',
    sortField,
    title: titleFromData,
    where,
  } = widgetData ?? {}
  const limit = widgetData?.limit ?? 5
  const collectionConfig = relatedCollection
    ? payload.collections[relatedCollection]?.config
    : undefined

  if (!relatedCollection || !collectionConfig) {
    return <div className="card collection-query-widget" />
  }

  const title = titleFromData || getTranslation(collectionConfig.labels.plural, req.i18n)
  const sort = sortField ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined

  const adminRoute = payload.config.routes.admin
  const result = await payload.find({
    collection: relatedCollection,
    depth: 0,
    limit,
    overrideAccess: false,
    sort,
    user,
    where,
  })
  const docs = result.docs as QueryDoc[]
  const documentLabelPath = getCollectionDocumentLabelPath(collectionConfig.admin)

  return (
    <div className="card collection-query-widget">
      <div className="collection-query-widget__header">
        <h3 className="collection-query-widget__title">{title}</h3>
      </div>
      {docs.length > 0 ? (
        <ul className="collection-query-widget__rows">
          {docs.map((doc) => {
            const docDate = getDocDate(doc)

            return (
              <li className="collection-query-widget__row" key={doc.id}>
                <a
                  className="collection-query-widget__row-link"
                  href={getDocumentHref({
                    id: doc.id,
                    adminRoute,
                    collectionSlug: relatedCollection,
                  })}
                >
                  <span className="collection-query-widget__row-main">
                    <span className="collection-query-widget__row-title">
                      {getDocLabel({ doc, documentLabelPath })}
                    </span>
                  </span>
                  <span className="collection-query-widget__row-meta">
                    {docDate ? <time dateTime={docDate}>{formatDate(docDate)}</time> : null}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="collection-query-widget__empty">No documents found.</p>
      )}
    </div>
  )
}

function getCollectionDocumentLabelPath(adminConfig: { useAsTitle?: string }) {
  return adminConfig.useAsTitle || 'id'
}

function getDocDate(doc: QueryDoc) {
  return doc.updatedAt || doc.createdAt
}

function getDocLabel({ doc, documentLabelPath }: { doc: QueryDoc; documentLabelPath: string }) {
  const title = doc[documentLabelPath]

  return typeof title === 'string' && title ? title : String(doc.id)
}

function getDocumentHref({
  id,
  adminRoute,
  collectionSlug,
}: {
  adminRoute: string
  collectionSlug: CollectionSlug
  id: number | string
}) {
  return formatAdminURL({
    adminRoute,
    path: `/collections/${collectionSlug}/${id}`,
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
