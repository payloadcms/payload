import type { FlattenedField, PayloadRequest, Where } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js'
import { getValueAtPath } from '../utilities/getvalueAtPath.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { setNestedValue } from '../utilities/setNestedValue.js'
import { flattenObject } from './flattenObject.js'
import { getCustomFieldFunctions } from './getCustomFieldFunctions.js'
import { getSelect } from './getSelect.js'

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
    const toCSVFunctions = getCustomFieldFunctions({
      fields: targetCollection.config.fields as FlattenedField[],
    })

    const possibleKeys = getFlattenedFieldKeys(targetCollection.config.fields as FlattenedField[])

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
