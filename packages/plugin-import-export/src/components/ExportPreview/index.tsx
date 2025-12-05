'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  CodeEditorLazy,
  Table,
  Translation,
  useConfig,
  useDebouncedEffect,
  useDocumentInfo,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import React, { useEffect, useMemo, useState, useTransition } from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import { buildDisabledFieldRegex } from '../../utilities/buildDisabledFieldRegex.js'
import './index.scss'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'export-preview'

export const ExportPreview: React.FC = () => {
  const [isPending, startTransition] = useTransition()
  const { collection } = useImportExport()
  const {
    config,
    config: { routes },
  } = useConfig()
  const { collectionSlug } = useDocumentInfo()
  const { draft, fields, format, limit, locale, page, sort, where } = useFormFields(([fields]) => {
    return {
      draft: fields['drafts']?.value,
      fields: fields['fields']?.value,
      format: fields['format']?.value,
      limit: fields['limit']?.value as number,
      locale: fields['locale']?.value as string,
      page: fields['page']?.value as number,
      sort: fields['sort']?.value as string,
      where: fields['where']?.value as Where,
    }
  })
  const [dataToRender, setDataToRender] = useState<any[]>([])
  const [resultCount, setResultCount] = useState<any>('')
  const [columns, setColumns] = useState<Column[]>([])
  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const targetCollectionSlug = typeof collection === 'string' && collection

  const targetCollectionConfig = useMemo(
    () => config.collections.find((collection) => collection.slug === targetCollectionSlug),
    [config.collections, targetCollectionSlug],
  )

  const disabledFieldRegexes: RegExp[] = useMemo(() => {
    const disabledFieldPaths =
      targetCollectionConfig?.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

    return disabledFieldPaths.map(buildDisabledFieldRegex)
  }, [targetCollectionConfig])

  const isCSV = format === 'csv'

  useDebouncedEffect(
    () => {
      if (!collectionSlug || !targetCollectionSlug) {
        return
      }

      const abortController = new AbortController()

      const fetchData = async () => {
        try {
          const res = await fetch(`${routes.api}/${collectionSlug}/export-preview`, {
            body: JSON.stringify({
              collectionSlug: targetCollectionSlug,
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
            signal: abortController.signal,
          })

          if (!res.ok) {
            return
          }

          const { docs, totalDocs }: { docs: Record<string, unknown>[]; totalDocs: number } =
            await res.json()

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

          setResultCount(totalDocs)
          setColumns(newColumns)
          setDataToRender(docs)
        } catch (error) {
          console.error('Error fetching preview data:', error)
        }
      }

      startTransition(async () => await fetchData())

      return () => {
        if (!abortController.signal.aborted) {
          abortController.abort('Component unmounted')
        }
      }
    },
    [
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
      routes.api,
      targetCollectionSlug,
    ],
    500,
  )

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>
          <Translation i18nKey="version:preview" t={t} />
        </h3>
        {resultCount && !isPending && (
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
      {isPending && !dataToRender && (
        <div className={`${baseClass}__loading`}>
          <Translation i18nKey="general:loading" t={t} />
        </div>
      )}
      {dataToRender &&
        (isCSV ? (
          <Table columns={columns} data={dataToRender} />
        ) : (
          <CodeEditorLazy language="json" readOnly value={JSON.stringify(dataToRender, null, 2)} />
        ))}
    </div>
  )
}
