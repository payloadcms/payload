import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { flattenObject } from './flattenObject.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

type Export = {
  collectionSlug: string
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
      exportsCollection,
      fields,
      format,
      locale: localeInput,
      sort,
      user,
      where,
    },
    input,
    req: { locale: localeArg, payload },
    req,
  } = args

  const locale = localeInput ?? localeArg
  const collectionConfig = payload.config.collections.find(({ slug }) => slug === collectionSlug)
  if (!collectionConfig) {
    throw new APIError(`Collection with slug ${collectionSlug} not found`)
  }

  const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`
  const isCsv = format === 'csv'

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

  if (download) {
    const stream = new Readable({ read() {} })
    let isFirstBatch = true

    while (result.hasNextPage) {
      findArgs.page += 1
      result = await payload.find(findArgs)

      if (isCsv) {
        const csvInput = result.docs.map((doc) => flattenObject(doc))
        const csvString = stringify(csvInput, { header: isFirstBatch })
        stream.push(csvString)
        isFirstBatch = false
      } else {
        const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
        stream.push(jsonInput.join(',\n') + '\n')
      }
    }

    stream.push(null) // End the stream

    // **Create and return Response**
    return new Response(await streamToBuffer(stream), {
      headers: new Headers({
        'Content-Disposition': `attachment; filename="${name}"`,
        'Content-Type': isCsv ? 'text/csv' : 'application/json',
      }),
      status: 200,
    })
  }

  const outputData: string[] = []
  let isFirstBatch = true

  while (result.hasNextPage) {
    findArgs.page += 1
    result = await payload.find(findArgs)

    if (isCsv) {
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
      mimetype: isCsv ? 'text/csv' : 'application/json',
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
        mimetype: isCsv ? 'text/csv' : 'application/json',
        size: buffer.length,
      },
      user,
    })
  }
}
