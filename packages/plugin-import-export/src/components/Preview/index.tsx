'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Table, Translation, useConfig, useField, useTranslation } from '@payloadcms/ui'
import * as qs from 'qs-esm'
import React from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import './index.scss'
import { flattenObject } from '../../export/flattenObject.js'
import { getCustomFieldFunctions } from '../../export/getCustomFieldFunctions.js'
import { getSelect } from '../../export/getSelect.js'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'preview'

export const Preview = () => {
  const { collection } = useImportExport()
  const { config } = useConfig()
  const { value: where } = useField({ path: 'where' })
  const { value: limit } = useField<number>({ path: 'limit' })
  const { value: fields } = useField<string[]>({ path: 'fields' })
  const { value: sort } = useField({ path: 'sort' })
  const { value: draft } = useField({ path: 'draft' })
  const [dataToRender, setDataToRender] = React.useState<any[]>([])
  const [resultCount, setResultCount] = React.useState<any>('')
  const [columns, setColumns] = React.useState<Column[]>([])
  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const collectionSlug = typeof collection === 'string' && collection
  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined

  React.useEffect(() => {
    const fetchData = async () => {
      if (!collectionSlug || !collectionConfig) {
        return
      }

      try {
        // Constructs query string for preview fetch (depth 1 to match export)
        const whereQuery = qs.stringify(
          {
            depth: 1,
            draft,
            limit: limit > 10 ? 10 : limit,
            sort,
            where,
          },
          {
            addQueryPrefix: true,
          },
        )

        const response = await fetch(`/api/${collectionSlug}${whereQuery}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setResultCount(limit && limit < data.totalDocs ? limit : data.totalDocs)

        const toCSVFunctions = getCustomFieldFunctions({
          fields: collectionConfig.fields ?? [],
          select,
        })

        // Flatten each doc (deeply nested --> flat row)
        const flattenedDocs = data.docs.map((doc: Record<string, unknown>) =>
          flattenObject({
            doc,
            fields,
            toCSVFunctions,
          }),
        )

        // Match CSV column ordering by building keys based on fields and regex
        const fieldToRegex = (field: string): RegExp => {
          const parts = field.split('.').map((part) => `${part}(?:_\\d+)?`)
          return new RegExp(`^${parts.join('_')}`)
        }

        const allKeys = Object.keys(flattenedDocs[0] || {})

        const defaultMetaFields = ['createdAt', 'updatedAt', '_status', 'id']

        // Construct final list of field keys to match field order + meta order
        const fieldKeys = (
          Array.isArray(fields) && fields.length > 0
            ? fields.flatMap((field) => {
                const regex = fieldToRegex(field)
                return allKeys.filter((key) => regex.test(key))
              })
            : allKeys.filter((key) => !defaultMetaFields.includes(key))
        ).concat(
          defaultMetaFields.flatMap((field) => {
            const regex = fieldToRegex(field)
            return allKeys.filter((key) => regex.test(key))
          }),
        )

        // Build columns based on flattened keys
        const newColumns: Column[] = fieldKeys.map((key) => ({
          accessor: key,
          active: true,
          field: { name: key } as ClientField,
          Heading: getTranslation(key, i18n),
          renderedCells: flattenedDocs.map((doc: Record<string, unknown>) => {
            const val = doc[key]

            if (val === undefined || val === null) {
              return null
            }

            // Avoid ESLint warning by type-checking before calling String()
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
              return String(val)
            }

            if (Array.isArray(val)) {
              return val.map(String).join(', ')
            }

            return JSON.stringify(val)
          }),
        }))

        setColumns(newColumns)
        setDataToRender(flattenedDocs)
      } catch (error) {
        console.error('Error fetching preview data:', error)
      }
    }

    void fetchData()
  }, [collectionConfig, collectionSlug, draft, fields, i18n, limit, select, sort, where])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>
          <Translation i18nKey="version:preview" t={t} />
        </h3>
        {resultCount && (
          <Translation
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            i18nKey="plugin-import-export:totalDocumentsCount"
            t={t}
            variables={{
              count: resultCount,
            }}
          />
        )}
      </div>
      {dataToRender && <Table columns={columns} data={dataToRender} />}
    </div>
  )
}
