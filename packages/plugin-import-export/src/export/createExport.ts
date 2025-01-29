import type { PaginatedDocs, PayloadRequest, Sort } from 'payload'

import { Buffer } from 'buffer'
import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'

import { flattenObject } from './flattenObject.js'
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
}

type Args = {
  data: Export
  req: PayloadRequest
}

export const createExport = async (args: Args) => {
  const {
    data: { collections = [], format },
    req: { locale, payload, user },
    req,
  } = args

  if (collections.length === 1 && format === 'csv') {
    const { slug, fields, sort } = collections[0] as Export['collections'][0]
    const collection = payload.config.collections.find((collection) => collection.slug === slug)
    if (!collection) {
      throw new Error(`Collection with slug ${slug} not found`)
    }

    if (!fields) {
      throw new APIError('fields must be defined when exporting')
    }

    const findArgs = {
      collection: slug,
      depth: 0,
      limit: 100,
      locale,
      req,
      select: getSelect(fields),
      sort,
      user,
    }

    let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs
    const csvData: string[] = []

    let isFirstBatch = true

    while (result.hasNextPage) {
      result = await payload.find(findArgs)
      const csvInput = result.docs.map((doc) => flattenObject(doc))

      const csvString = stringify(csvInput, {
        header: isFirstBatch, // Only include header in the first batch
      })

      csvData.push(csvString)
      isFirstBatch = false
    }

    const csvBuffer = Buffer.from(csvData.join(''))

    req.file = {
      name: `${collection.slug}.csv`,
      data: csvBuffer,
      mimetype: 'text/csv',
      size: csvBuffer.length,
    }
  }
}
