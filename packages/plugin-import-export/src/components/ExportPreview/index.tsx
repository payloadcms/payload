'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField, PaginatedDocs, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  CodeEditorLazy,
  Pagination,
  PerPage,
  Table,
  Translation,
  useConfig,
  useDebouncedEffect,
  useDocumentInfo,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import React, { useEffect, useRef, useState, useTransition } from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'
import type { ExportPreviewResponse } from '../../types.js'

import { DEFAULT_PREVIEW_LIMIT, PREVIEW_LIMIT_OPTIONS } from '../../constants.js'
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
  const { draft, fields, format, limit, locale, sort, where } = useFormFields(([fields]) => {
    return {
      draft: fields['drafts']?.value,
      fields: fields['fields']?.value,
      format: fields['format']?.value,
      limit: fields['limit']?.value as number,
      locale: fields['locale']?.value as string,
      sort: fields['sort']?.value as string,
      where: fields['where']?.value as Where,
    }
  })
  const [dataToRender, setDataToRender] = useState<any[]>([])
  const [exportTotalDocs, setExportTotalDocs] = useState<number>(0)
  const [maxLimit, setMaxLimit] = useState<number | undefined>(undefined)
  const [columns, setColumns] = useState<Column[]>([])
  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  // Preview pagination state (separate from export config)
  const [previewPage, setPreviewPage] = useState(1)
  const [previewLimit, setPreviewLimit] = useState(DEFAULT_PREVIEW_LIMIT)
  const [paginationData, setPaginationData] = useState<null | Pick<
    PaginatedDocs,
    'hasNextPage' | 'hasPrevPage' | 'limit' | 'nextPage' | 'page' | 'prevPage' | 'totalPages'
  >>(null)

  // Track previous export config to reset preview page when it changes
  const prevExportConfigRef = useRef({ draft, fields, format, limit, locale, sort, where })

  // Reset preview page when export config changes
  useEffect(() => {
    const prevConfig = prevExportConfigRef.current
    const configChanged =
      prevConfig.draft !== draft ||
      prevConfig.limit !== limit ||
      prevConfig.locale !== locale ||
      prevConfig.sort !== sort ||
      JSON.stringify(prevConfig.fields) !== JSON.stringify(fields) ||
      JSON.stringify(prevConfig.where) !== JSON.stringify(where)

    if (configChanged) {
      setPreviewPage(1)
      prevExportConfigRef.current = { draft, fields, format, limit, locale, sort, where }
    }
  }, [draft, fields, format, limit, locale, sort, where])

  const targetCollectionSlug = typeof collection === 'string' && collection

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
              previewLimit,
              previewPage,
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

          const {
            columns: serverColumns,
            docs,
            exportTotalDocs: serverExportTotalDocs,
            hasNextPage,
            hasPrevPage,
            limit: responseLimit,
            maxLimit: serverMaxLimit,
            page: responsePage,
            totalPages,
          }: ExportPreviewResponse = await res.json()

          // For CSV: use server-provided columns (from getSchemaColumns) for consistent ordering
          // For JSON: derive keys from docs
          const allKeys = Array.from(new Set(docs.flatMap((doc) => Object.keys(doc))))

          // Use server columns if available (CSV format), otherwise fall back to data-derived keys
          const fieldKeys = serverColumns && serverColumns.length > 0 ? serverColumns : allKeys

          // Build columns based on field keys
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

          setExportTotalDocs(serverExportTotalDocs)
          setMaxLimit(serverMaxLimit)
          setPaginationData({
            hasNextPage,
            hasPrevPage,
            limit: responseLimit,
            nextPage: responsePage + 1,
            page: responsePage,
            prevPage: responsePage - 1,
            totalPages,
          })
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
      draft,
      fields,
      format,
      i18n,
      limit,
      locale,
      previewLimit,
      previewPage,
      sort,
      where,
      routes.api,
      targetCollectionSlug,
    ],
    500,
  )

  const handlePageChange = (page: number) => {
    setPreviewPage(page)
  }

  const handlePerPageChange = (newLimit: number) => {
    setPreviewLimit(newLimit)
    setPreviewPage(1)
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>
          <Translation i18nKey="version:preview" t={t} />
        </h3>
        {exportTotalDocs > 0 && !isPending && (
          <div className={`${baseClass}__export-info`}>
            <span className={`${baseClass}__export-count`}>
              <Translation
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                i18nKey="plugin-import-export:documentsToExport"
                t={t}
                variables={{
                  count: exportTotalDocs,
                }}
              />
            </span>
            {typeof maxLimit === 'number' &&
              maxLimit > 0 &&
              typeof limit === 'number' &&
              limit > maxLimit && (
                <span className={`${baseClass}__limit-capped`}>
                  <Translation
                    // @ts-expect-error - plugin translations not typed
                    i18nKey="plugin-import-export:limitCapped"
                    t={t}
                    variables={{
                      limit: maxLimit,
                    }}
                  />
                </span>
              )}
          </div>
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
      {paginationData && exportTotalDocs > 0 && (
        <div className={`${baseClass}__pagination`}>
          {paginationData.totalPages > 1 && (
            <Pagination
              hasNextPage={paginationData.hasNextPage}
              hasPrevPage={paginationData.hasPrevPage}
              nextPage={paginationData.nextPage ?? undefined}
              numberOfNeighbors={1}
              onChange={handlePageChange}
              page={paginationData.page}
              prevPage={paginationData.prevPage ?? undefined}
              totalPages={paginationData.totalPages}
            />
          )}
          <span className={`${baseClass}__page-info`}>
            <Translation
              // @ts-expect-error - plugin translations not typed
              i18nKey="plugin-import-export:previewPageInfo"
              t={t}
              variables={{
                end: Math.min((paginationData.page ?? 1) * previewLimit, exportTotalDocs),
                start: ((paginationData.page ?? 1) - 1) * previewLimit + 1,
                total: exportTotalDocs,
              }}
            />
          </span>
          <PerPage
            handleChange={handlePerPageChange}
            limit={previewLimit}
            limits={PREVIEW_LIMIT_OPTIONS}
          />
        </div>
      )}
    </div>
  )
}
