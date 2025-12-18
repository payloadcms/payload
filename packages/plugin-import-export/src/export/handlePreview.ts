import type { FlattenedField, PayloadRequest, Where } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import { flattenObject } from '../utilities/flattenObject.js'
import { getExportFieldFunctions } from '../utilities/getExportFieldFunctions.js'
import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js'
import { getSchemaColumns } from '../utilities/getSchemaColumns.js'
import { getSelect } from '../utilities/getSelect.js'
import { getValueAtPath } from '../utilities/getvalueAtPath.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { setNestedValue } from '../utilities/setNestedValue.js'

const DEFAULT_PREVIEW_LIMIT = 10

export const handlePreview = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)

  const {
    collectionSlug,
    draft: draftFromReq,
    fields,
    limit: exportLimit,
    locale,
    previewLimit = DEFAULT_PREVIEW_LIMIT,
    previewPage = 1,
    sort,
    where: whereFromReq = {},
  } = req.data as {
    collectionSlug: string
    draft?: 'no' | 'yes'
    fields?: string[]
    format?: 'csv' | 'json'
    limit?: number
    locale?: string
    previewLimit?: number
    previewPage?: number
    sort?: any
    where?: any
  }

  const targetCollection = req.payload.collections[collectionSlug]
  if (!targetCollection) {
    return Response.json(
      { error: `Collection with slug ${collectionSlug} not found` },
      { status: 400 },
    )
  }

  const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined
  const draft = draftFromReq === 'yes'
  const collectionHasVersions = Boolean(targetCollection.config.versions)

  // Only filter by _status for versioned collections
  const publishedWhere: Where = collectionHasVersions ? { _status: { equals: 'published' } } : {}

  const where: Where = {
    and: [whereFromReq, draft ? {} : publishedWhere],
  }

  // Count total docs matching export criteria
  const countResult = await req.payload.count({
    collection: collectionSlug,
    overrideAccess: false,
    req,
    where,
  })

  const totalMatchingDocs = countResult.totalDocs

  // Calculate actual export count (respecting export limit)
  const exportTotalDocs =
    exportLimit && exportLimit > 0 ? Math.min(totalMatchingDocs, exportLimit) : totalMatchingDocs

  // Calculate preview pagination that respects export limit
  // Preview should only show docs that will actually be exported
  const previewStartIndex = (previewPage - 1) * previewLimit

  // Calculate pagination info based on export limit (not raw DB results)
  const previewTotalPages = Math.ceil(exportTotalDocs / previewLimit)

  // If we're beyond the export limit, return empty
  if (exportLimit && exportLimit > 0 && previewStartIndex >= exportLimit) {
    return Response.json({
      columns: [],
      docs: [],
      exportTotalDocs,
      hasNextPage: false,
      hasPrevPage: previewPage > 1,
      limit: previewLimit,
      page: previewPage,
      totalDocs: exportTotalDocs,
      totalPages: previewTotalPages,
    })
  }

  // Fetch preview page with full previewLimit to maintain consistent pagination offsets
  // We'll trim the results afterwards if needed to respect export limit
  const result = await req.payload.find({
    collection: collectionSlug,
    depth: 1,
    draft,
    limit: previewLimit,
    locale,
    overrideAccess: false,
    page: previewPage,
    req,
    select,
    sort,
    where,
  })

  // Trim docs to respect export limit boundary
  let docs = result.docs
  if (exportLimit && exportLimit > 0) {
    const remainingInExport = exportLimit - previewStartIndex
    if (remainingInExport < docs.length) {
      docs = docs.slice(0, remainingInExport)
    }
  }

  const isCSV = req?.data?.format === 'csv'

  let transformed: Record<string, unknown>[] = []
  let columns: string[] = []

  if (isCSV) {
    const toCSVFunctions = getExportFieldFunctions({
      fields: targetCollection.config.fields as FlattenedField[],
    })

    // Get locale codes for locale expansion when locale='all'
    const localeCodes =
      locale === 'all' && req.payload.config.localization
        ? req.payload.config.localization.localeCodes
        : undefined

    // Get disabled fields configuration
    const disabledFields =
      targetCollection.config.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

    // Use getSchemaColumns for consistent ordering with actual export
    columns = getSchemaColumns({
      collectionConfig: targetCollection.config,
      disabledFields,
      fields,
      locale: locale ?? undefined,
      localeCodes,
    })

    const possibleKeys = getFlattenedFieldKeys(
      targetCollection.config.fields as FlattenedField[],
      '',
      { localeCodes },
    )

    transformed = docs.map((doc) => {
      const row = flattenObject({
        doc,
        fields,
        toCSVFunctions,
      })

      for (const key of possibleKeys) {
        if (!(key in row)) {
          row[key] = null
        }
      }

      return row
    })
  } else {
    const disabledFields =
      targetCollection.config.admin.custom?.['plugin-import-export']?.disabledFields

    transformed = docs.map((doc) => {
      let output: Record<string, unknown> = { ...doc }

      // Remove disabled fields first
      output = removeDisabledFields(output, disabledFields)

      // Then trim to selected fields only (if fields are provided)
      if (Array.isArray(fields) && fields.length > 0) {
        const trimmed: Record<string, unknown> = {}

        for (const key of fields) {
          const value = getValueAtPath(output, key)
          setNestedValue(trimmed, key, value ?? null)
        }

        output = trimmed
      }

      return output
    })
  }

  const hasNextPage = previewPage < previewTotalPages
  const hasPrevPage = previewPage > 1

  return Response.json({
    columns: isCSV ? columns : undefined,
    docs: transformed,
    // Export count - actual number of docs that will be exported
    exportTotalDocs,
    // Preview pagination info (based on exportTotalDocs, not raw DB count)
    hasNextPage,
    hasPrevPage,
    limit: previewLimit,
    page: previewPage,
    totalDocs: exportTotalDocs,
    totalPages: previewTotalPages,
  })
}
