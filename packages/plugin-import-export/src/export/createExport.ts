import type { PaginatedDocs, PayloadRequest, Sort, User } from 'payload'

import { Buffer } from 'buffer'
import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'

import { flattenObject } from './flattenObject.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

type Export = {
  collections: {
    fields?: string[]
    slug: string
    sort: Sort
  }[]
  format: 'csv' | 'json'
  globals?: string[]
  id: number | string
  name: string
  user: string
  userCollection: string
}

export type CreateExportArgs = {
  input: Export
  req: PayloadRequest
  user?: User
}

export const createExport = async (args: CreateExportArgs) => {
  const {
    input: { id, name: nameArg, collections = [], format, user },
    req: { locale, payload },
    req,
  } = args

  if (collections.length === 1 && format === 'csv') {
    const { slug, fields, sort } = collections[0] as Export['collections'][0]
    const collection = payload.config.collections.find((collection) => collection.slug === slug)
    if (!collection) {
      throw new Error(`Collection with slug ${slug} not found`)
    }
    const name = nameArg ?? `${getFilename()}-${collection.slug}`

    if (!fields) {
      throw new APIError('fields must be defined when exporting')
    }

    const findArgs = {
      collection: slug,
      depth: 0,
      limit: 100,
      locale,
      overrideAccess: false,
      page: 0,
      select: getSelect(fields),
      sort,
      user,
    }

    let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs
    const csvData: string[] = []

    let isFirstBatch = true

    while (result.hasNextPage) {
      findArgs.page = findArgs.page + 1
      result = await payload.find(findArgs)
      const csvInput = result.docs.map((doc) => flattenObject(doc))

      const csvString = stringify(csvInput, {
        header: isFirstBatch, // Only include header in the first batch
      })

      csvData.push(csvString)
      isFirstBatch = false
    }

    const csvBuffer = Buffer.from(csvData.join(''))

    // when `disableJobsQueue` is true, the export is created synchronously in a beforeOperation hook
    if (!id) {
      req.file = {
        name: `${name}-${collection.slug}.csv`,
        data: csvBuffer,
        mimetype: 'text/csv',
        size: csvBuffer.length,
      }
    } else {
      await req.payload.update({
        id,
        collection: 'exports',
        data: {},
        file: {
          name: `${name}.${format}`,
          data: csvBuffer,
          mimetype: 'text/csv',
          size: csvBuffer.length,
        },
      })
    }
  }
}
