import type { CollectionSlug, Field, Where, WidgetServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatDistanceToNow } from 'date-fns'
import { fieldAffectsData, fieldHasSubFields, formatAdminURL, tabHasName } from 'payload/shared'
import React from 'react'

import '../../elements/Card/index.css'
import './index.css'
import { isCollectionQuerySortableField } from './shared.js'

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

type CollectionFieldPathSets = {
  fieldPaths: Set<string>
  sortableFieldPaths: Set<string>
}

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
  const fieldPathSets = collectionConfig
    ? getCollectionFieldPathSets(collectionConfig.fields)
    : {
        fieldPaths: new Set<string>(),
        sortableFieldPaths: new Set<string>(),
      }
  const validationErrors = getValidationErrors({
    collectionConfig,
    fieldPathSets,
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
      label: formatRelativeDate(dateTime),
    }
  }

  if (typeof value === 'string') {
    if (isDateString(value)) {
      return {
        dateTime: value,
        label: formatRelativeDate(value),
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

function getCollectionFieldPathSets(fields: Field[]): CollectionFieldPathSets {
  const fieldPathSets: CollectionFieldPathSets = {
    fieldPaths: new Set(baseFieldPaths),
    sortableFieldPaths: new Set(baseFieldPaths),
  }

  addFieldPathSets({ fieldPathSets, fields })

  return fieldPathSets
}

function addFieldPathSets({
  fieldPathSets,
  fields,
  parentPath,
}: {
  fieldPathSets: CollectionFieldPathSets
  fields: Field[]
  parentPath?: string
}) {
  for (const field of fields) {
    if ('virtual' in field && field.virtual === true) {
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        addFieldPathSets({
          fieldPathSets,
          fields: tab.fields,
          parentPath: tabHasName(tab) ? getFieldPath({ parentPath, path: tab.name }) : parentPath,
        })
      }

      continue
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      addFieldPathSets({ fieldPathSets, fields: field.fields, parentPath })

      continue
    }

    if (!fieldAffectsData(field)) {
      continue
    }

    const path = getFieldPath({
      parentPath,
      path: typeof field.virtual === 'string' ? field.virtual : field.name,
    })

    fieldPathSets.fieldPaths.add(path)

    if (isCollectionQuerySortableField(field)) {
      fieldPathSets.sortableFieldPaths.add(path)
    }

    if (fieldHasSubFields(field)) {
      addFieldPathSets({ fieldPathSets, fields: field.fields, parentPath: path })
    }
  }
}

function getFieldPath({ parentPath, path }: { parentPath?: string; path: string }) {
  return [parentPath, path].filter(Boolean).join('.')
}

function getValidationErrors({
  collectionConfig,
  fieldPathSets,
  relatedCollection,
  sortField,
  where,
}: {
  collectionConfig: unknown
  fieldPathSets: CollectionFieldPathSets
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

  if (sortField) {
    if (!fieldPathSets.fieldPaths.has(sortField)) {
      errors.push(`Sort field "${sortField}" does not exist on collection "${relatedCollection}".`)
    } else if (!fieldPathSets.sortableFieldPaths.has(sortField)) {
      errors.push(`Sort field "${sortField}" is not sortable on collection "${relatedCollection}".`)
    }
  }

  for (const fieldPath of getWhereFieldPaths(where)) {
    if (!fieldPathSets.fieldPaths.has(fieldPath)) {
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

function formatRelativeDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return formatCompactDistance(formatDistanceToNow(date))
}

function formatCompactDistance(distance: string) {
  if (distance.startsWith('less than') || distance.startsWith('half')) {
    return '<1m'
  }

  const normalizedDistance = distance.replace(/^(?:about|almost|over)\s/, '')
  const match = normalizedDistance.match(/^(a|an|\d+)\s+([a-z]+)/)

  if (!match) {
    return distance
  }

  const amount = match[1] === 'a' || match[1] === 'an' ? 1 : Number(match[1])
  const unit = relativeDateUnitLabels[match[2]]

  if (!unit) {
    return distance
  }

  return `${amount}${unit}`
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime())
}

const relativeDateUnitLabels: Record<string, string> = {
  day: 'd',
  days: 'd',
  hour: 'h',
  hours: 'h',
  minute: 'm',
  minutes: 'm',
  month: 'mo',
  months: 'mo',
  second: 's',
  seconds: 's',
  year: 'y',
  years: 'y',
}
