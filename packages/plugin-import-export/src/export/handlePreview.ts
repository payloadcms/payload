import type { FlattenedField, PayloadRequest, Where } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import { flattenObject } from '../utilities/flattenObject.js'
import { getExportFieldFunctions } from '../utilities/getExportFieldFunctions.js'
import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js'
import { getSelect } from '../utilities/getSelect.js'
import { getValueAtPath } from '../utilities/getvalueAtPath.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { setNestedValue } from '../utilities/setNestedValue.js'

export const handlePreview = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)

  const {
    collectionSlug,
    draft: draftFromReq,
    fields,
    limit,
    locale,
    page,
    sort,
    where: whereFromReq = {},
  } = req.data as {
    collectionSlug: string
    draft?: 'no' | 'yes'
    fields?: string[]
    format?: 'csv' | 'json'
    limit?: number
    locale?: string
    page?: number
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

  const result = await req.payload.find({
    collection: collectionSlug,
    depth: 1,
    draft,
    limit: limit && limit > 10 ? 10 : limit,
    locale,
    overrideAccess: false,
    page,
    req,
    select,
    sort,
    where,
  })

  const isCSV = req?.data?.format === 'csv'
  const docs = result.docs

  let transformed: Record<string, unknown>[] = []

  if (isCSV) {
    const toCSVFunctions = getExportFieldFunctions({
      fields: targetCollection.config.fields as FlattenedField[],
    })

    // Get locale codes for locale expansion when locale='all'
    const localeCodes =
      locale === 'all' && req.payload.config.localization
        ? req.payload.config.localization.localeCodes
        : undefined

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

  return Response.json({
    docs: transformed,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  })
}
