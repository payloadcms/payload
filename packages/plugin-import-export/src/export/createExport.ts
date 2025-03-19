import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { flattenObject } from './flattenObject.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

type Export = {
  collectionSlug: string
  drafts?: 'no' | 'yes'
  exportsCollection: string
  fields?: string[]
  format: 'csv' | 'json'
  globals?: string[]
  id: number | string
  locale?: string
  name: string
  slug: string
  sort: Sort
  user: string
  userCollection: string
  where?: Where
}

export type CreateExportArgs = {
  /**
   * If true, stream the file instead of saving it
   */
  download?: boolean
  input: Export
  req: PayloadRequest
  user?: User
}

export const createExport = async (args: CreateExportArgs) => {
  const {
    download,
    input: {
      id,
      name: nameArg,
      collectionSlug,
      drafts,
      exportsCollection,
      fields,
      format,
      locale: localeInput,
      sort,
      user,
      where,
    },
    req: { locale: localeArg, payload },
    req,
  } = args
  const locale = localeInput ?? localeArg
  const collectionConfig = payload.config.collections.find(({ slug }) => slug === collectionSlug)
  if (!collectionConfig) {
    throw new APIError(`Collection with slug ${collectionSlug} not found`)
  }

  const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`
  const isCSV = format === 'csv'

  const findArgs = {
    collection: collectionSlug,
    depth: 0,
    draft: drafts === 'yes',
    limit: 100,
    locale,
    overrideAccess: false,
    page: 0,
    select: Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined,
    sort,
    user,
    where,
  }

  let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs

  if (download) {
    const encoder = new TextEncoder()
    const stream = new Readable({
      async read() {
        let result = await payload.find(findArgs)
        let isFirstBatch = true

        while (result.docs.length > 0) {
          const csvInput = result.docs.map((doc) => flattenObject(doc))
          const csvString = stringify(csvInput, { header: isFirstBatch })
          this.push(encoder.encode(csvString))
          isFirstBatch = false

          if (!result.hasNextPage) {
            this.push(null) // End the stream
            break
          }

          findArgs.page += 1
          result = await payload.find(findArgs)
        }
      },
    })

    return new Response(stream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${name}"`,
        'Content-Type': isCSV ? 'text/csv' : 'application/json',
      },
    })
  }

  const outputData: string[] = []
  let isFirstBatch = true

  while (result.hasNextPage) {
    findArgs.page += 1
    result = await payload.find(findArgs)

    if (isCSV) {
      const csvInput = result.docs.map((doc) => flattenObject(doc))
      outputData.push(stringify(csvInput, { header: isFirstBatch }))
      isFirstBatch = false
    } else {
      const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
      outputData.push(jsonInput.join(',\n'))
    }
  }

  const buffer = Buffer.from(format === 'json' ? `[${outputData.join(',')}]` : outputData.join(''))

  if (!id) {
    req.file = {
      name,
      data: buffer,
      mimetype: isCSV ? 'text/csv' : 'application/json',
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
        mimetype: isCSV ? 'text/csv' : 'application/json',
        size: buffer.length,
      },
      user,
    })
  }
}
