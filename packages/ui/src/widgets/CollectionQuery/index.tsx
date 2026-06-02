import type { I18n } from '@payloadcms/translations'
import type { CollectionSlug, Where, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { CollectionFieldPaths } from './getCollectionFieldPaths.js'

import '../../elements/Card/index.css'
import './index.css'
import { getCollectionFieldPaths } from './getCollectionFieldPaths.js'

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

const minLimit = 1
const maxLimit = 25

const emptyFieldPaths: CollectionFieldPaths = {
  filterableFieldPaths: new Set<string>(),
  relationshipFieldPaths: new Set<string>(),
  sortableFieldPaths: new Set<string>(),
}

export async function CollectionQueryWidget({
  req,
  widgetData,
}: WidgetServerProps<{ data?: CollectionQueryWidgetData }>) {
  const { i18n, payload, user } = req
  const {
    relatedCollection,
    sortDirection = 'desc',
    sortField,
    title: titleFromData,
    where,
  } = widgetData ?? {}
  const limit = clampLimit(widgetData?.limit)
  const collectionConfig = relatedCollection
    ? payload.collections[relatedCollection]?.config
    : undefined

  const title =
    titleFromData ||
    (collectionConfig
      ? getTranslation(collectionConfig.labels.plural, i18n)
      : i18n.t('dashboard:widgetTitleFallback'))

  const fieldPaths = collectionConfig
    ? getCollectionFieldPaths(collectionConfig.fields)
    : emptyFieldPaths
  const validationErrors = getValidationErrors({
    collectionConfig,
    fieldPaths,
    i18n,
    relatedCollection,
    sortField,
    where,
  })

  if (validationErrors.length > 0 || !relatedCollection || !collectionConfig) {
    return <CollectionQueryError errors={validationErrors} i18n={i18n} title={title} />
  }

  const sort = sortField ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined
  const adminRoute = payload.config.routes.admin

  let docs: QueryDoc[]

  try {
    const result = await payload.find({
      collection: relatedCollection,
      depth: 0,
      limit,
      overrideAccess: false,
      sort,
      user,
      where,
    })

    docs = result.docs as QueryDoc[]
  } catch (err) {
    payload.logger.error({
      err,
      msg: `CollectionQueryWidget: failed to query collection "${relatedCollection}"`,
    })

    return (
      <CollectionQueryError
        errors={[i18n.t('dashboard:widgetQueryError')]}
        i18n={i18n}
        title={title}
      />
    )
  }

  const documentLabelPath = getCollectionDocumentLabelPath(collectionConfig.admin)
  const relativeTimeFormat = getRelativeTimeFormat(i18n.language)

  return (
    <div className="card collection-query-widget">
      <div className="collection-query-widget__header">
        <h3 className="collection-query-widget__title">{title}</h3>
      </div>
      {docs.length > 0 ? (
        <ul className="collection-query-widget__rows">
          {docs.map((doc) => {
            const sortMeta = getDocSortMeta({ doc, i18n, relativeTimeFormat, sortField })

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
        <p className="collection-query-widget__empty">{i18n.t('general:noResultsFound')}</p>
      )}
    </div>
  )
}

function CollectionQueryError({
  errors,
  i18n,
  title,
}: {
  errors: string[]
  i18n: I18n
  title: string
}) {
  return (
    <div className="card collection-query-widget collection-query-widget--error">
      <div className="collection-query-widget__header">
        <h3 className="collection-query-widget__title">{title}</h3>
      </div>
      <div className="collection-query-widget__error">
        <p className="collection-query-widget__error-title">
          {i18n.t('dashboard:widgetConfigurationError')}
        </p>
        <ul className="collection-query-widget__error-list">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function clampLimit(limit: number | undefined) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return 5
  }

  return Math.min(Math.max(Math.floor(limit), minLimit), maxLimit)
}

function getCollectionDocumentLabelPath(adminConfig: { useAsTitle?: string }) {
  return adminConfig.useAsTitle || 'id'
}

function getDocSortMeta({
  doc,
  i18n,
  relativeTimeFormat,
  sortField,
}: {
  doc: QueryDoc
  i18n: I18n
  relativeTimeFormat: Intl.RelativeTimeFormat
  sortField?: string
}) {
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
      label: formatRelativeDate({ relativeTimeFormat, value: dateTime }),
    }
  }

  if (typeof value === 'string') {
    if (isDateString(value)) {
      return {
        dateTime: value,
        label: formatRelativeDate({ relativeTimeFormat, value }),
      }
    }

    return { label: value }
  }

  if (typeof value === 'number') {
    return { label: value.toLocaleString(i18n.language) }
  }

  if (typeof value === 'boolean') {
    return { label: value ? i18n.t('general:true') : i18n.t('general:false') }
  }

  return null
}

function getDocLabel({ doc, documentLabelPath }: { doc: QueryDoc; documentLabelPath: string }) {
  const title = getValueByPath({ object: doc, path: documentLabelPath })

  return typeof title === 'string' && title ? title : String(doc.id)
}

function getValidationErrors({
  collectionConfig,
  fieldPaths,
  i18n,
  relatedCollection,
  sortField,
  where,
}: {
  collectionConfig: unknown
  fieldPaths: CollectionFieldPaths
  i18n: I18n
  relatedCollection?: CollectionSlug
  sortField?: string
  where?: Where
}) {
  const errors: string[] = []

  if (!relatedCollection) {
    errors.push(i18n.t('dashboard:widgetCollectionRequired'))

    return errors
  }

  if (!collectionConfig) {
    errors.push(i18n.t('dashboard:widgetInvalidCollection', { collection: relatedCollection }))

    return errors
  }

  if (sortField) {
    if (!fieldPaths.filterableFieldPaths.has(sortField)) {
      errors.push(
        i18n.t('dashboard:widgetInvalidSortField', {
          collection: relatedCollection,
          field: sortField,
        }),
      )
    } else if (!fieldPaths.sortableFieldPaths.has(sortField)) {
      errors.push(
        i18n.t('dashboard:widgetNonSortableSortField', {
          collection: relatedCollection,
          field: sortField,
        }),
      )
    }
  }

  for (const fieldPath of getWhereFieldPaths(where)) {
    if (
      fieldPaths.filterableFieldPaths.has(fieldPath) ||
      hasRelationshipAncestor({
        path: fieldPath,
        relationshipFieldPaths: fieldPaths.relationshipFieldPaths,
      })
    ) {
      continue
    }

    errors.push(
      i18n.t('dashboard:widgetInvalidFilterField', {
        collection: relatedCollection,
        field: fieldPath,
      }),
    )
  }

  return errors
}

/**
 * A `where` path that traverses into a relationship (e.g. `category.name`) cannot be validated
 * against this collection's fields because it targets another collection, so accept it when any
 * ancestor segment is a relationship.
 */
function hasRelationshipAncestor({
  path,
  relationshipFieldPaths,
}: {
  path: string
  relationshipFieldPaths: Set<string>
}) {
  const segments = path.split('.')
  let prefix = ''

  for (const segment of segments) {
    prefix = prefix ? `${prefix}.${segment}` : segment

    if (relationshipFieldPaths.has(prefix)) {
      return true
    }
  }

  return false
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

    fieldPaths.add(key)
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

function getRelativeTimeFormat(language: string) {
  try {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto', style: 'narrow' })
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' })
  }
}

const relativeTimeDivisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
]

function formatRelativeDate({
  relativeTimeFormat,
  value,
}: {
  relativeTimeFormat: Intl.RelativeTimeFormat
  value: string
}) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  let duration = (date.getTime() - Date.now()) / 1000

  for (const division of relativeTimeDivisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormat.format(Math.round(duration), division.unit)
    }

    duration /= division.amount
  }

  return relativeTimeFormat.format(Math.round(duration), 'years')
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime())
}
