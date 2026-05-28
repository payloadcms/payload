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

const baseFieldPaths = ['createdAt', 'id', 'updatedAt']

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

  const title =
    titleFromData ||
    (collectionConfig
      ? getTranslation(collectionConfig.labels.plural, req.i18n)
      : 'Collection query')
  const fieldPaths = collectionConfig
    ? getCollectionFieldPaths(collectionConfig.fields)
    : new Set<string>()
  const validationErrors = getValidationErrors({
    collectionConfig,
    fieldPaths,
    relatedCollection,
    sortField,
    where,
  })

  if (validationErrors.length > 0 || !relatedCollection || !collectionConfig) {
    return <CollectionQueryError errors={validationErrors} title={title} />
  }

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
            const sortMeta = getDocSortMeta({ doc, sortField })

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
                    {sortMeta ? (
                      sortMeta.dateTime ? (
                        <time dateTime={sortMeta.dateTime}>{sortMeta.label}</time>
                      ) : (
                        sortMeta.label
                      )
                    ) : null}
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

function CollectionQueryError({ errors, title }: { errors: string[]; title: string }) {
  return (
    <div className="card collection-query-widget collection-query-widget--error">
      <div className="collection-query-widget__header">
        <h3 className="collection-query-widget__title">{title}</h3>
      </div>
      <div className="collection-query-widget__error">
        <p className="collection-query-widget__error-title">Widget configuration error</p>
        <ul className="collection-query-widget__error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function getCollectionDocumentLabelPath(adminConfig: { useAsTitle?: string }) {
  return adminConfig.useAsTitle || 'id'
}

function getDocSortMeta({ doc, sortField }: { doc: QueryDoc; sortField?: string }) {
  const value = sortField
    ? getValueByPath({ object: doc, path: sortField })
    : doc.updatedAt || doc.createdAt

  if (value === null || typeof value === 'undefined' || value === '') {
    return null
  }

  if (value instanceof Date) {
    const dateTime = value.toISOString()

    return {
      dateTime,
      label: formatDate(dateTime),
    }
  }

  if (typeof value === 'string') {
    if (isDateString(value)) {
      return {
        dateTime: value,
        label: formatDate(value),
      }
    }

    return { label: value }
  }

  if (typeof value === 'number') {
    return { label: value.toLocaleString() }
  }

  if (typeof value === 'boolean') {
    return { label: value ? 'True' : 'False' }
  }

  return null
}

function getDocLabel({ doc, documentLabelPath }: { doc: QueryDoc; documentLabelPath: string }) {
  const title = doc[documentLabelPath]

  return typeof title === 'string' && title ? title : String(doc.id)
}

function getCollectionFieldPaths(fields: unknown[]) {
  const paths = new Set(baseFieldPaths)

  addFieldPaths({ fields, paths })

  return paths
}

function addFieldPaths({
  fields,
  parentPath,
  paths,
}: {
  fields: unknown[]
  parentPath?: string
  paths: Set<string>
}) {
  for (const field of fields) {
    if (!field || typeof field !== 'object') {
      continue
    }

    const fieldConfig = field as { fields?: unknown[]; name?: string }
    const path = fieldConfig.name
      ? [parentPath, fieldConfig.name].filter(Boolean).join('.')
      : parentPath

    if (path) {
      paths.add(path)
    }

    if (Array.isArray(fieldConfig.fields)) {
      addFieldPaths({ fields: fieldConfig.fields, parentPath: path, paths })
    }
  }
}

function getValidationErrors({
  collectionConfig,
  fieldPaths,
  relatedCollection,
  sortField,
  where,
}: {
  collectionConfig: unknown
  fieldPaths: Set<string>
  relatedCollection?: CollectionSlug
  sortField?: string
  where?: Where
}) {
  const errors: string[] = []

  if (!relatedCollection) {
    errors.push('Collection is required.')

    return errors
  }

  if (!collectionConfig) {
    errors.push(`Collection "${relatedCollection}" does not exist.`)

    return errors
  }

  if (sortField && !fieldPaths.has(sortField)) {
    errors.push(`Sort field "${sortField}" does not exist on collection "${relatedCollection}".`)
  }

  for (const fieldPath of getWhereFieldPaths(where)) {
    if (!fieldPaths.has(fieldPath)) {
      errors.push(
        `Filter field "${fieldPath}" does not exist on collection "${relatedCollection}".`,
      )
    }
  }

  return errors
}

function getWhereFieldPaths(where: undefined | Where) {
  const fieldPaths = new Set<string>()

  collectWhereFieldPaths({ fieldPaths, value: where })

  return fieldPaths
}

function collectWhereFieldPaths({
  fieldPaths,
  value,
}: {
  fieldPaths: Set<string>
  value: unknown
}) {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectWhereFieldPaths({ fieldPaths, value: item })
    }

    return
  }

  for (const [key, childValue] of Object.entries(value)) {
    if (key === 'and' || key === 'or') {
      collectWhereFieldPaths({ fieldPaths, value: childValue })

      continue
    }

    if (!whereOperatorKeys.has(key)) {
      fieldPaths.add(key)
    }

    collectWhereFieldPaths({ fieldPaths, value: childValue })
  }
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

function getValueByPath({ object, path }: { object: Record<string, unknown>; path: string }) {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, object)
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

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime())
}

const whereOperatorKeys = new Set([
  'all',
  'contains',
  'equals',
  'exists',
  'greater_than',
  'greater_than_equal',
  'in',
  'intersects',
  'less_than',
  'less_than_equal',
  'like',
  'near',
  'not_equals',
  'not_in',
  'within',
])
