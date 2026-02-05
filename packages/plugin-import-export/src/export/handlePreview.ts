import type { FlattenedField, PayloadRequest, Where } from 'payload'

import { addDataAndFileToRequest } from 'payload'
import { getObjectDotNotation } from 'payload/shared'

import type { ExportPreviewResponse } from '../types.js'

import {
  DEFAULT_PREVIEW_LIMIT,
  MAX_PREVIEW_LIMIT,
  MIN_PREVIEW_LIMIT,
  MIN_PREVIEW_PAGE,
} from '../constants.js'
import { collectTimezoneCompanionFields } from '../utilities/collectTimezoneCompanionFields.js'
import { flattenObject } from '../utilities/flattenObject.js'
import { getExportFieldFunctions } from '../utilities/getExportFieldFunctions.js'
import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js'
import { getSchemaColumns } from '../utilities/getSchemaColumns.js'
import { getSelect } from '../utilities/getSelect.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { resolveLimit } from '../utilities/resolveLimit.js'
import { setNestedValue } from '../utilities/setNestedValue.js'

export const handlePreview = async (req: PayloadRequest): Promise<Response> => {
  await addDataAndFileToRequest(req)

  const {
    collectionSlug,
    draft: draftFromReq,
    fields,
    limit: exportLimit,
    locale,
    previewLimit: rawPreviewLimit = DEFAULT_PREVIEW_LIMIT,
    previewPage: rawPreviewPage = 1,
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

  // Validate and clamp pagination values to safe bounds
  const previewLimit = Math.max(MIN_PREVIEW_LIMIT, Math.min(rawPreviewLimit, MAX_PREVIEW_LIMIT))
  const previewPage = Math.max(MIN_PREVIEW_PAGE, rawPreviewPage)

  const targetCollection = req.payload.collections[collectionSlug]
  if (!targetCollection) {
    return Response.json(
      { error: `Collection with slug ${collectionSlug} not found` },
      { status: 400 },
    )
  }

  const pluginConfig = targetCollection.config.custom?.['plugin-import-export']
  const maxLimit = await resolveLimit({
    limit: pluginConfig?.exportLimit,
    req,
  })

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

  // Calculate actual export count (respecting both export limit and max limit)
  let effectiveLimit = totalMatchingDocs

  // Apply user's export limit if provided
  if (exportLimit && exportLimit > 0) {
    effectiveLimit = Math.min(effectiveLimit, exportLimit)
  }

  // Apply max limit if configured
  if (typeof maxLimit === 'number' && maxLimit > 0) {
    effectiveLimit = Math.min(effectiveLimit, maxLimit)
  }

  const exportTotalDocs = effectiveLimit

  // Calculate preview pagination that respects export limit
  // Preview should only show docs that will actually be exported
  const previewStartIndex = (previewPage - 1) * previewLimit

  // Calculate pagination info based on export limit (not raw DB results)
  const previewTotalPages = exportTotalDocs === 0 ? 0 : Math.ceil(exportTotalDocs / previewLimit)

  const isCSV = req?.data?.format === 'csv'

  // Get locale codes for locale expansion when locale='all'
  const localeCodes =
    locale === 'all' && req.payload.config.localization
      ? req.payload.config.localization.localeCodes
      : undefined

  // Get disabled fields configuration
  const disabledFields =
    targetCollection.config.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

  // Collect auto-generated timezone companion fields from schema
  const timezoneCompanionFields = collectTimezoneCompanionFields(
    targetCollection.config.flattenedFields,
  )

  // Always compute columns for CSV (even if no docs) for consistent schema
  const columns = isCSV
    ? getSchemaColumns({
        collectionConfig: targetCollection.config,
        disabledFields,
        fields,
        locale: locale ?? undefined,
        localeCodes,
        timezoneCompanionFields,
      })
    : undefined

  // If we're beyond the effective limit (considering both user limit and maxLimit), return empty docs
  if (exportTotalDocs > 0 && previewStartIndex >= exportTotalDocs) {
    const response: ExportPreviewResponse = {
      columns,
      docs: [],
      exportTotalDocs,
      hasNextPage: false,
      hasPrevPage: previewPage > 1,
      limit: previewLimit,
      maxLimit,
      page: previewPage,
      totalDocs: exportTotalDocs,
      totalPages: previewTotalPages,
    }
    return Response.json(response)
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

  // Trim docs to respect effective limit boundary (user limit clamped by maxLimit)
  let docs = result.docs
  if (exportTotalDocs > 0) {
    const remainingInExport = exportTotalDocs - previewStartIndex
    if (remainingInExport < docs.length) {
      docs = docs.slice(0, remainingInExport)
    }
  }

  // Transform docs based on format
  let transformed: Record<string, unknown>[]

  if (isCSV) {
    const toCSVFunctions = getExportFieldFunctions({
      fields: targetCollection.config.fields as FlattenedField[],
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
        timezoneCompanionFields,
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
    transformed = docs.map((doc) => {
      let output: Record<string, unknown> = { ...doc }

      // Remove disabled fields first
      output = removeDisabledFields(output, disabledFields)

      // Then trim to selected fields only (if fields are provided)
      if (Array.isArray(fields) && fields.length > 0) {
        const trimmed: Record<string, unknown> = {}

        for (const key of fields) {
          const value = getObjectDotNotation(output, key)
          setNestedValue(trimmed, key, value ?? null)
        }

        output = trimmed
      }

      return output
    })
  }

  const hasNextPage = previewPage < previewTotalPages
  const hasPrevPage = previewPage > 1

  const response: ExportPreviewResponse = {
    columns,
    docs: transformed,
    exportTotalDocs,
    hasNextPage,
    hasPrevPage,
    limit: previewLimit,
    maxLimit,
    page: previewPage,
    totalDocs: exportTotalDocs,
    totalPages: previewTotalPages,
  }

  return Response.json(response)
}
