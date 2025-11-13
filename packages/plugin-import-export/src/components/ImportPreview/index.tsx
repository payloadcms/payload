'use client'
import type { Column } from '@payloadcms/ui'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Table,
  Translation,
  useConfig,
  useField,
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import { formatDocTitle } from '@payloadcms/ui/shared'
import { fieldAffectsData } from 'payload/shared'
import React from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import './index.scss'

const baseClass = 'import-preview'

export const ImportPreview = () => {
  const { value: collectionSlug } = useField<string>({ path: 'collectionSlug' })
  const { value: importMode } = useField<string>({ path: 'importMode' })
  const { value: matchField } = useField<string>({ path: 'matchField' })
  const { value: filename } = useField<string>({ path: 'filename' })
  const { value: url } = useField<string>({ path: 'url' })
  const { value: mimeType } = useField<string>({ path: 'mimeType' })
  const { value: status } = useField<string>({ path: 'status' })
  const { value: summary } = useField<any>({ path: 'summary' })

  // Access the file field directly from form fields
  const fileField = useFormFields(([fields]) => fields?.file || null)

  const [dataToRender, setDataToRender] = React.useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = React.useState<Column[]>([])
  const [resultCount, setResultCount] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)

  const { config } = useConfig()
  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const collectionConfig = React.useMemo(
    () => config.collections.find((c) => c.slug === collectionSlug),
    [collectionSlug, config.collections],
  )

  React.useEffect(() => {
    const processFileData = async () => {
      if (!collectionSlug || (!url && !fileField?.value)) {
        setDataToRender([])
        setColumns([])
        setResultCount(0)
        return
      }

      if (!collectionConfig) {
        setDataToRender([])
        setColumns([])
        setResultCount(0)
        return
      }

      setLoading(true)
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
          const response = await fetch(url)
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
          setResultCount(0)
          return
        }

        // Fetch transformed data from the server
        const res = await fetch('/api/import-preview-data', {
          body: JSON.stringify({
            collectionSlug,
            fileData,
            format,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!res.ok) {
          throw new Error('Failed to process file')
        }

        const { docs, totalDocs }: { docs: Record<string, unknown>[]; totalDocs: number } =
          await res.json()

        setResultCount(totalDocs)

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
              const value = getValueAtPath(doc, fieldPath)
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
                const value = getValueAtPath(doc, fieldPath)

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
                  // Format dates
                  const dateFormat =
                    (field.admin && 'date' in field.admin && field.admin.date?.displayFormat) ||
                    config.admin.dateFormat

                  return new Date(value as string).toLocaleString(i18n.language, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
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
            if (field.type === 'tabs' && 'tabs' in field) {
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
                    tabLabel && parentLabel
                      ? `${parentLabel} > ${tabLabel}`
                      : tabLabel || parentLabel,
                  )
                  cols.push(...tabCols)
                }
              })
            }
          })

          return cols
        }

        // Add default meta fields at the end
        const fieldColumns = buildColumnsFromFields(collectionConfig.fields)
        const metaFields = ['id', 'createdAt', 'updatedAt', '_status']

        metaFields.forEach((metaField) => {
          const hasData = docs.some((doc) => doc[metaField] !== undefined)
          if (!hasData) {
            return
          }

          fieldColumns.push({
            accessor: metaField,
            active: true,
            field: { name: metaField } as ClientField,
            Heading: getTranslation(metaField, i18n),
            renderedCells: docs.map((doc) => {
              const value = doc[metaField]
              if (value === undefined || value === null) {
                return null
              }

              if (metaField === 'createdAt' || metaField === 'updatedAt') {
                return new Date(value as string).toLocaleString(i18n.language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              }

              return String(value)
            }),
          })
        })

        setColumns(fieldColumns)
        setDataToRender(docs.slice(0, 10)) // Limit preview to 10 rows
      } catch (err) {
        console.error('Error processing file data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
        setDataToRender([])
        setColumns([])
        setResultCount(0)
      } finally {
        setLoading(false)
      }
    }

    void processFileData()
  }, [collectionSlug, url, filename, mimeType, fileField?.value, collectionConfig, config, i18n])

  // If import has been processed, show results instead of preview
  if (status !== 'pending' && summary) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__header`}>
          <h3>
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

  if (!collectionSlug) {
    return (
      <div className={baseClass}>
        <p style={{ opacity: 0.6 }}>
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
          <Translation i18nKey="plugin-import-export:uploadFileToSeePreview" t={t} />
        </p>
      </div>
    )
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h3>
          <Translation i18nKey="version:preview" t={t} />
        </h3>
        {resultCount > 0 && (
          <div>
            <Translation
              i18nKey="plugin-import-export:totalDocumentsCount"
              t={t}
              variables={{
                count: resultCount,
              }}
            />
            {' | '}
            <Translation i18nKey="plugin-import-export:mode" t={t} />: {importMode || 'create'}
            {importMode !== 'create' && (
              <>
                {' | '}
                <Translation i18nKey="plugin-import-export:matchBy" t={t} />: {matchField || 'id'}
              </>
            )}
          </div>
        )}
      </div>
      {loading && (
        <p>
          <Translation i18nKey="general:loading" t={t} />
        </p>
      )}
      {!loading && dataToRender.length > 0 && <Table columns={columns} data={dataToRender} />}
      {!loading && dataToRender.length === 0 && collectionSlug && (
        <p>
          <Translation i18nKey="plugin-import-export:noDataToPreview" t={t} />
        </p>
      )}
    </div>
  )
}

// Helper function to get nested values
const getValueAtPath = (obj: Record<string, unknown>, path: string): unknown => {
  const segments = path.split('.')
  let current: any = obj

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[segment]
  }

  return current
}
