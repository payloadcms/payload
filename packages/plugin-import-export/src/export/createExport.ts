import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

import { Buffer } from 'buffer'
import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'

import { flattenObject } from './flattenObject.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

type Export = {
  collectionSlug: string
  exportsCollection: string
  fields?: string[]
  format: 'csv' | 'json'
  globals?: string[]
  id: number | string
  name: string
  slug: string
  sort: Sort
  user: string
  userCollection: string
  where?: Where
}

export type CreateExportArgs = {
  input: Export
  req: PayloadRequest
  user?: User
}

export const createExport = async (args: CreateExportArgs) => {
  const {
    input: {
      id,
      name: nameArg,
      collectionSlug,
      exportsCollection,
      fields,
      format,
      sort,
      user,
      where,
    },
    req: { locale, payload },
    req,
  } = args

  const collectionConfig = payload.config.collections.find(({ slug }) => slug === collectionSlug)
  if (!collectionConfig) {
    throw new APIError(`Collection with slug ${collectionSlug} not found`)
  }
  const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`

  const findArgs = {
    collection: collectionSlug,
    depth: 0,
    limit: 100,
    locale,
    overrideAccess: false,
    page: 0,
    select: fields ? getSelect(fields) : undefined,
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

  const buffer = Buffer.from(format === 'json' ? `[${outputData.join(',')}]` : outputData.join(''))

  // when `disableJobsQueue` is true, the export is created synchronously in a beforeOperation hook
  if (!id) {
    req.file = {
      name,
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
        name,
        data: buffer,
        mimetype: format === 'json' ? 'application/json' : `text/${format}`,
        size: buffer.length,
      },
    })
  }
}
