'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  CodeEditorLazy,
  Table,
  Translation,
  useConfig,
  useField,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import { buildDisabledFieldRegex } from '../../utilities/buildDisabledFieldRegex.js'
import './index.scss'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'preview'

export const Preview = () => {
  const { collection } = useImportExport()
  const { config } = useConfig()
  const { value: where } = useField({ path: 'where' })
  const { value: page } = useField({ path: 'page' })
  const { value: limit } = useField<number>({ path: 'limit' })
  const { value: fields } = useField<string[]>({ path: 'fields' })
  const { value: sort } = useField({ path: 'sort' })
  const { value: draft } = useField({ path: 'drafts' })
  const { value: locale } = useField({ path: 'locale' })
  const { value: format } = useField({ path: 'format' })
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

  const disabledFieldRegexes: RegExp[] = React.useMemo(() => {
    const disabledFieldPaths =
      collectionConfig?.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

    return disabledFieldPaths.map(buildDisabledFieldRegex)
  }, [collectionConfig])

  const isCSV = format === 'csv'

  React.useEffect(() => {
    const fetchData = async () => {
      if (!collectionSlug || !collectionConfig) {
        return
      }

      try {
        const res = await fetch('/api/preview-data', {
          body: JSON.stringify({
            collectionSlug,
            draft,
            fields,
            format,
            limit,
            locale,
            page,
            sort,
            where,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!res.ok) {
          return
        }

        const { docs, totalDocs }: { docs: Record<string, unknown>[]; totalDocs: number } =
          await res.json()

        setResultCount(limit && limit < totalDocs ? limit : totalDocs)

        const allKeys = Array.from(new Set(docs.flatMap((doc) => Object.keys(doc))))
        const defaultMetaFields = ['createdAt', 'updatedAt', '_status', 'id']

        // Match CSV column ordering by building keys based on fields and regex
        const fieldToRegex = (field: string): RegExp => {
          const parts = field.split('.').map((part) => `${part}(?:_\\d+)?`)
          return new RegExp(`^${parts.join('_')}`)
        }

        // Construct final list of field keys to match field order + meta order
        const selectedKeys =
          Array.isArray(fields) && fields.length > 0
            ? fields.flatMap((field) => {
                const regex = fieldToRegex(field)
                return allKeys.filter(
                  (key) =>
                    regex.test(key) &&
                    !disabledFieldRegexes.some((disabledRegex) => disabledRegex.test(key)),
                )
              })
            : allKeys.filter(
                (key) =>
                  !defaultMetaFields.includes(key) &&
                  !disabledFieldRegexes.some((regex) => regex.test(key)),
              )

        const fieldKeys =
          Array.isArray(fields) && fields.length > 0
            ? selectedKeys // strictly use selected fields only
            : [
                ...selectedKeys,
                ...defaultMetaFields.filter(
                  (key) => allKeys.includes(key) && !selectedKeys.includes(key),
                ),
              ]

        // Build columns based on flattened keys
        const newColumns: Column[] = fieldKeys.map((key) => ({
          accessor: key,
          active: true,
          field: { name: key } as ClientField,
          Heading: getTranslation(key, i18n),
          renderedCells: docs.map((doc: Record<string, unknown>) => {
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
        setDataToRender(docs)
      } catch (error) {
        console.error('Error fetching preview data:', error)
      }
    }

    void fetchData()
  }, [
    collectionConfig,
    collectionSlug,
    disabledFieldRegexes,
    draft,
    fields,
    format,
    i18n,
    limit,
    locale,
    page,
    sort,
    where,
  ])

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
      {dataToRender &&
        (isCSV ? (
          <Table columns={columns} data={dataToRender} />
        ) : (
          <CodeEditorLazy language="json" readOnly value={JSON.stringify(dataToRender, null, 2)} />
        ))}
    </div>
  )
}
