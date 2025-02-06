import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

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
    where?: Where
  }[]
  exportsCollection: string
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
    input: { id, name: nameArg, collections = [], exportsCollection, format, user },
    req: { locale, payload },
    req,
  } = args

  if (collections.length === 1) {
    const { slug, fields, sort, where } = collections[0] as Export['collections'][0]
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
      where,
    }

    let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs
    const outputData: string[] = []

    let isFirstBatch = true

    while (result.hasNextPage) {
      findArgs.page = findArgs.page + 1
      result = await payload.find(findArgs)

      if (format === 'csv') {
        const csvInput = result.docs.map((doc) => flattenObject(doc))

        const csvString = stringify(csvInput, {
          header: isFirstBatch, // Only include header in the first batch
        })

        outputData.push(csvString)
        isFirstBatch = false
      }

      if (format === 'json') {
        const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
        outputData.push(jsonInput.join(',\n'))
      }
    }

    const buffer = Buffer.from(
      format === 'json' ? `[${outputData.join(',')}]` : outputData.join(''),
    )

    // when `disableJobsQueue` is true, the export is created synchronously in a beforeOperation hook
    if (!id) {
      req.file = {
        name: `${name}-${collection.slug}.${format}`,
        data: buffer,
        mimetype: format === 'json' ? 'application/json' : `text/${format}`,
        size: buffer.length,
      }
    } else {
      await req.payload.update({
        id,
        collection: exportsCollection,
        data: {},
        file: {
          name: `${name}.${format}`,
          data: buffer,
          mimetype: format === 'json' ? 'application/json' : `text/${format}`,
          size: buffer.length,
        },
      })
    }
  }
}
