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
  const collectionLabel = getTranslation(collectionConfig.labels.singular, req.i18n)
  const collectionPluralLabel = getTranslation(collectionConfig.labels.plural, req.i18n)

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
        <div className="collection-query-widget__control" title={collectionPluralLabel}>
          <span className="collection-query-widget__control-muted">{collectionPluralLabel}:</span>
          <span>{result.totalDocs.toLocaleString()}</span>
          <CaretIcon />
        </div>
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
                    <span className="collection-query-widget__pill">{collectionLabel}</span>
                    <span className="collection-query-widget__row-title">
                      {getDocLabel({ doc, documentLabelPath })}
                    </span>
                  </span>
                  <span className="collection-query-widget__row-meta">
                    {docDate ? <time dateTime={docDate}>{formatDate(docDate)}</time> : null}
                    <OpenIcon />
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

function CaretIcon() {
  return (
    <svg
      aria-hidden="true"
      className="collection-query-widget__control-icon"
      fill="none"
      height="12"
      viewBox="0 0 12 12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.5 4.75L6 7.25L8.5 4.75" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

function OpenIcon() {
  return (
    <svg
      aria-hidden="true"
      className="collection-query-widget__open-icon"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4H4.5C3.67 4 3 4.67 3 5.5V11.5C3 12.33 3.67 13 4.5 13H10.5C11.33 13 12 12.33 12 11.5V10"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path d="M9 3H13V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8L13 3" stroke="currentColor" strokeLinecap="round" />
    </svg>
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
