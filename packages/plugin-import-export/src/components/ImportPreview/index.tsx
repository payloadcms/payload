'use client'
<<<<<<< GermanJablo/create-query-preset
import type { ClientField, Column, ConditionalDateProps, PaginatedDocs } from 'payload'
=======
import type { Column } from '@payloadcms/ui'
import type { ClientField, PaginatedDocs } from 'payload'
>>>>>>> main

import { getTranslation } from '@payloadcms/translations'
import {
  Pagination,
  PerPage,
  Table,
  Translation,
  useConfig,
  useDebouncedEffect,
  useDocumentInfo,
  useField,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import { formatDocTitle } from '@payloadcms/ui/shared'
import { fieldAffectsData, getObjectDotNotation } from 'payload/shared'
import React, { useState, useTransition } from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'
import type { ImportPreviewResponse } from '../../types.js'

import { DEFAULT_PREVIEW_LIMIT, PREVIEW_LIMIT_OPTIONS } from '../../constants.js'
import './index.scss'

const baseClass = 'import-preview'

export const ImportPreview: React.FC = () => {
  const [isPending, startTransition] = useTransition()
  const {
    config,
    config: { routes },
  } = useConfig()
  const { collectionSlug } = useDocumentInfo()
  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const { value: targetCollectionSlug } = useField<string>({ path: 'collectionSlug' })
  const { value: importMode } = useField<string>({ path: 'importMode' })
  const { value: matchField } = useField<string>({ path: 'matchField' })
  const { value: filename } = useField<string>({ path: 'filename' })
  const { value: url } = useField<string>({ path: 'url' })
  const { value: mimeType } = useField<string>({ path: 'mimeType' })
  const { value: status } = useField<string>({ path: 'status' })
  const { value: summary } = useField<any>({ path: 'summary' })

  // Access the file field directly from form fields
  const fileField = useFormFields(([fields]) => fields?.file || null)

  const [dataToRender, setDataToRender] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [totalDocs, setTotalDocs] = useState<number>(0)
  const [error, setError] = useState<null | string>(null)

  // Preview pagination state
  const [previewPage, setPreviewPage] = useState(1)
  const [previewLimit, setPreviewLimit] = useState(DEFAULT_PREVIEW_LIMIT)
  const [paginationData, setPaginationData] = useState<null | Pick<
    PaginatedDocs,
    'hasNextPage' | 'hasPrevPage' | 'limit' | 'nextPage' | 'page' | 'prevPage' | 'totalPages'
  >>(null)

  const collectionConfig = React.useMemo(
    () => config.collections.find((c) => c.slug === targetCollectionSlug),
    [targetCollectionSlug, config.collections],
  )

  useDebouncedEffect(
    () => {
      if (!collectionSlug || !targetCollectionSlug) {
        return
      }

      if (!targetCollectionSlug || (!url && !fileField?.value)) {
        setDataToRender([])
        setColumns([])
        setTotalDocs(0)
        setPaginationData(null)
        return
      }

      if (!collectionConfig) {
        setDataToRender([])
        setColumns([])
        setTotalDocs(0)
        setPaginationData(null)
        return
      }

      const abortController = new AbortController()

      const processFileData = async () => {
        setError(null)

        try {
          // Determine format from file
          let format: 'csv' | 'json' = 'json'
          if (fileField?.value && fileField.value instanceof File) {
            const file = fileField.value
            format = file.type === 'text/csv' || file.name?.endsWith('.csv') ? 'csv' : 'json'
          } else if (mimeType === 'text/csv' || filename?.endsWith('.csv')) {
            format = 'csv'
          }

          // Get file data as base64
          let fileData: string | undefined

          if (fileField?.value && fileField.value instanceof File) {
            // File is being uploaded, read its contents
            const arrayBuffer = await fileField.value.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            fileData = base64
          } else if (url) {
            // File has been saved, fetch from URL
            const response = await fetch(url, { signal: abortController.signal })
            if (!response.ok) {
              throw new Error('Failed to fetch file')
            }
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            fileData = base64
          }

          if (!fileData) {
            setDataToRender([])
            setColumns([])
            setTotalDocs(0)
            setPaginationData(null)
            return
          }

          // Fetch transformed data from the server
          const res = await fetch(`${routes.api}/${collectionSlug}/preview-data`, {
            body: JSON.stringify({
              collectionSlug: targetCollectionSlug,
              fileData,
              format,
              previewLimit,
              previewPage,
            }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal: abortController.signal,
          })

          if (!res.ok) {
            throw new Error('Failed to process file')
          }

          const {
            docs,
            hasNextPage,
            hasPrevPage,
            limit: responseLimit,
            page: responsePage,
            totalDocs: serverTotalDocs,
            totalPages,
          }: ImportPreviewResponse = await res.json()

          setTotalDocs(serverTotalDocs)
          setPaginationData({
            hasNextPage,
            hasPrevPage,
            limit: responseLimit,
            nextPage: responsePage + 1,
            page: responsePage,
            prevPage: responsePage - 1,
            totalPages,
          })

          if (!Array.isArray(docs) || docs.length === 0) {
            setDataToRender([])
            setColumns([])
            return
          }

          // Build columns from collection fields without traverseFields
          const buildColumnsFromFields = (
            fields: ClientField[],
            parentPath = '',
            parentLabel = '',
          ): Column[] => {
            const cols: Column[] = []

            fields.forEach((field) => {
              if (!fieldAffectsData(field) || field.admin?.disabled) {
                return
              }

              // Build the field path
              const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name

              // Get the field label
              let label = field.name
              if ('label' in field && field.label) {
                label = getTranslation(field.label, i18n)
              }

              // Add parent label prefix if in a group
              if (parentLabel) {
                label = `${parentLabel} > ${label}`
              }

              // Skip if this field doesn't exist in any document
              const hasData = docs.some((doc) => {
                const value = getObjectDotNotation(doc, fieldPath)
                return value !== undefined && value !== null
              })

              if (!hasData && field.type !== 'relationship') {
                return
              }

              cols.push({
                accessor: fieldPath,
                active: true,
                field,
                Heading: label,
                renderedCells: docs.map((doc) => {
                  const value = getObjectDotNotation(doc, fieldPath)

                  if (value === undefined || value === null) {
                    return null
                  }

                  // Format based on field type
                  if (field.type === 'relationship' || field.type === 'upload') {
                    // Handle relationships
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      // Single relationship
                      const relationTo = Array.isArray(field.relationTo)
                        ? (value as any).relationTo
                        : field.relationTo

                      const relatedConfig = config.collections.find((c) => c.slug === relationTo)
                      if (relatedConfig && relatedConfig.admin?.useAsTitle) {
                        const titleValue = (value as any)[relatedConfig.admin.useAsTitle]
                        if (titleValue) {
                          return formatDocTitle({
                            collectionConfig: relatedConfig,
                            data: value as any,
                            dateFormat: config.admin.dateFormat,
                            i18n,
                          })
                        }
                      }

                      // Fallback to ID
                      const id = (value as any).id || value
                      return `${getTranslation(relatedConfig?.labels?.singular || relationTo, i18n)}: ${id}`
                    } else if (Array.isArray(value)) {
                      // Multiple relationships
                      return value
                        .map((item) => {
                          if (typeof item === 'object') {
                            const relationTo = Array.isArray(field.relationTo)
                              ? item.relationTo
                              : field.relationTo
                            const relatedConfig = config.collections.find(
                              (c) => c.slug === relationTo,
                            )

                            if (relatedConfig && relatedConfig.admin?.useAsTitle) {
                              const titleValue = item[relatedConfig.admin.useAsTitle]
                              if (titleValue) {
                                return formatDocTitle({
                                  collectionConfig: relatedConfig,
                                  data: item,
                                  dateFormat: config.admin.dateFormat,
                                  i18n,
                                })
                              }
                            }

                            return item.id || item
                          }
                          return item
                        })
                        .join(', ')
                    }

                    // Just an ID
                    return String(value)
                  } else if (field.type === 'date') {
                    // Display date as string to avoid wrong locale/timezone conversion
                    return String(value)
                  } else if (field.type === 'checkbox') {
                    return value ? '✓' : '✗'
                  } else if (field.type === 'select' || field.type === 'radio') {
                    // Show the label for select/radio options
                    const option = field.options?.find((opt) => {
                      if (typeof opt === 'string') {
                        return opt === value
                      }
                      return opt.value === value
                    })

                    if (option && typeof option === 'object') {
                      return getTranslation(option.label, i18n)
                    }
                    return String(value)
                  } else if (field.type === 'number') {
                    return String(value)
                  } else if (Array.isArray(value)) {
                    // Handle arrays
                    if (field.type === 'blocks') {
                      return value.map((block: any) => `${block.blockType || 'Block'}`).join(', ')
                    }
                    return `[${value.length} items]`
                  } else if (typeof value === 'object') {
                    // Handle objects
                    if (field.type === 'group') {
                      return '{...}'
                    }
                    return JSON.stringify(value)
                  }

                  return String(value)
                }),
              })

              // For groups, add nested fields with parent label
              if (field.type === 'group' && 'fields' in field) {
                const groupLabel =
                  'label' in field && field.label ? getTranslation(field.label, i18n) : field.name

                const nestedCols = buildColumnsFromFields(
                  field.fields,
                  fieldPath,
                  parentLabel ? `${parentLabel} > ${groupLabel}` : groupLabel,
                )
                cols.push(...nestedCols)
              }

              // For tabs, process the fields within
              if ('tabs' in field && Array.isArray(field.tabs)) {
                field.tabs.forEach((tab) => {
                  if ('name' in tab && tab.name) {
                    // Named tab
                    const tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
                    const tabLabel =
                      'label' in tab && tab.label ? getTranslation(tab.label, i18n) : tab.name

                    const tabCols = buildColumnsFromFields(
                      tab.fields,
                      tabPath,
                      parentLabel ? `${parentLabel} > ${tabLabel}` : tabLabel,
                    )
                    cols.push(...tabCols)
                  } else {
                    // Unnamed tab - fields go directly under parent
                    const tabLabel =
                      'label' in tab && tab.label ? getTranslation(tab.label, i18n) : ''

                    const tabCols = buildColumnsFromFields(
                      tab.fields,
                      parentPath,
                      tabLabel && typeof tabLabel === 'string' && parentLabel
                        ? `${parentLabel} > ${tabLabel}`
                        : typeof tabLabel === 'string'
                          ? tabLabel
                          : parentLabel,
                    )
                    cols.push(...tabCols)
                  }
                })
              }
            })

            return cols
          }

          const fieldColumns = buildColumnsFromFields(collectionConfig.fields)

          const existingAccessors = new Set(fieldColumns.map((column) => column.accessor))

          // Discover all fields from document data to determine column order
          // Respect the order fields appear in the data (e.g., CSV column order)
          const dataFieldOrder: string[] = []
          const dataFieldsSet = new Set<string>()

          // Collect all fields from all docs to get comprehensive field list
          docs.forEach((doc) => {
            Object.keys(doc).forEach((key) => {
              if (!dataFieldsSet.has(key) && doc[key] !== undefined && doc[key] !== null) {
                dataFieldsSet.add(key)
                dataFieldOrder.push(key)
              }
            })
          })

          // Helper to create a column for a field
          const createColumnForField = (fieldName: string): Column => ({
            accessor: fieldName,
            active: true,
            field: { name: fieldName } as ClientField,
            Heading: getTranslation(fieldName, i18n),
            renderedCells: docs.map((doc) => {
              const value = doc[fieldName]
              if (value === undefined || value === null) {
                return null
              }

              return String(value)
            }),
          })

          // Build columns respecting data order for fields not in config
          // For fields in config, use their natural order from fieldColumns
          const finalColumns: Column[] = []
          const addedAccessors = new Set<string>()

          // Process fields in the order they appear in the data
          dataFieldOrder.forEach((fieldName) => {
            if (existingAccessors.has(fieldName)) {
              // This field is from the collection config
              const configColumn = fieldColumns.find((col) => col.accessor === fieldName)
              if (configColumn && !addedAccessors.has(fieldName)) {
                finalColumns.push(configColumn)
                addedAccessors.add(fieldName)
              }
            } else {
              // This is an additional field (system field or extra data field)
              if (!addedAccessors.has(fieldName)) {
                finalColumns.push(createColumnForField(fieldName))
                addedAccessors.add(fieldName)
              }
            }
          })

          // Add any remaining config fields that weren't in the data
          fieldColumns.forEach((col) => {
            if (!addedAccessors.has(col.accessor)) {
              finalColumns.push(col)
              addedAccessors.add(col.accessor)
            }
          })

          setColumns(finalColumns)
          setDataToRender(docs)
        } catch (err) {
          console.error('Error processing file data:', err)
          setError(err instanceof Error ? err.message : 'Failed to load preview')
          setDataToRender([])
          setColumns([])
          setTotalDocs(0)
          setPaginationData(null)
        }
      }

      startTransition(async () => await processFileData())

      return () => {
        if (!abortController.signal.aborted) {
          abortController.abort('Component unmounted')
        }
      }
    },
    [
      collectionSlug,
      targetCollectionSlug,
      url,
      filename,
      mimeType,
      fileField?.value,
      collectionConfig,
      config,
      i18n,
      previewLimit,
      previewPage,
      routes.api,
    ],
    500,
  )

  // If import has been processed, show results instead of preview
  if (status !== 'pending' && summary) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__header`}>
          <h3>
            {/* @ts-expect-error - translations are not typed in plugins */}
            <Translation i18nKey="plugin-import-export:importResults" t={t} />
          </h3>
        </div>
        <div className={`${baseClass}__results`}>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Imported:</strong> {summary.imported || 0}
          </p>
          <p>
            <strong>Updated:</strong> {summary.updated || 0}
          </p>
          <p>
            <strong>Total:</strong> {summary.total || 0}
          </p>
          {summary.issues > 0 && (
            <p>
              <strong>Issues:</strong> {summary.issues}
            </p>
          )}
          {summary.issueDetails && summary.issueDetails.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Issue Details:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                {summary.issueDetails.slice(0, 10).map((issue: any, index: number) => (
                  <li key={index}>
                    Row {issue.row}: {issue.error}
                  </li>
                ))}
                {summary.issueDetails.length > 10 && (
                  <li>... and {summary.issueDetails.length - 10} more issues</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!targetCollectionSlug) {
    return (
      <div className={baseClass}>
        <p style={{ opacity: 0.6 }}>
          {/* @ts-expect-error - translations are not typed in plugins */}
          <Translation i18nKey="plugin-import-export:collectionRequired" t={t} />
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={baseClass}>
        <p style={{ color: 'red' }}>
          <Translation i18nKey="general:error" t={t} />: {error}
        </p>
      </div>
    )
  }

  if (!url && !fileField?.value) {
    return (
      <div className={baseClass}>
        <p style={{ opacity: 0.6 }}>
          {/* @ts-expect-error - translations are not typed in plugins */}
          <Translation i18nKey="plugin-import-export:uploadFileToSeePreview" t={t} />
        </p>
      </div>
    )
  }

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
        {totalDocs > 0 && !isPending && (
          <div className={`${baseClass}__info`}>
            <span className={`${baseClass}__import-count`}>
              <Translation
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                i18nKey="plugin-import-export:documentsToImport"
                t={t}
                variables={{
                  count: totalDocs,
                }}
              />
            </span>
            {' | '}
            {/* @ts-expect-error - translations are not typed in plugins */}
            <Translation i18nKey="plugin-import-export:mode" t={t} />: {importMode || 'create'}
            {importMode !== 'create' && (
              <>
                {' | '}
                {/* @ts-expect-error - translations are not typed in plugins */}
                <Translation i18nKey="plugin-import-export:matchBy" t={t} />: {matchField || 'id'}
              </>
            )}
          </div>
        )}
      </div>
      {isPending && !dataToRender.length && (
        <div className={`${baseClass}__loading`}>
          <Translation i18nKey="general:loading" t={t} />
        </div>
      )}
      {dataToRender.length > 0 && <Table columns={columns} data={dataToRender} />}
      {!isPending && dataToRender.length === 0 && targetCollectionSlug && (
        <p>
          {/* @ts-expect-error - translations are not typed in plugins */}
          <Translation i18nKey="plugin-import-export:noDataToPreview" t={t} />
        </p>
      )}
      {paginationData && totalDocs > 0 && (
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
                end: Math.min((paginationData.page ?? 1) * previewLimit, totalDocs),
                start: ((paginationData.page ?? 1) - 1) * previewLimit + 1,
                total: totalDocs,
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
