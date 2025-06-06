/* eslint-disable no-console */
import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { flattenObject } from './flattenObject.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

type Export = {
  collectionSlug: string
  /**
   * If true, enables debug logging
   */
  debug?: boolean
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
      debug = false,
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

  console.log('debug createExport', debug)

  if (debug) {
    console.log('Starting export process with args:', { collectionSlug, drafts, fields, format })
  }

  const locale = localeInput ?? localeArg
  const collectionConfig = payload.config.collections.find(({ slug }) => slug === collectionSlug)
  if (!collectionConfig) {
    throw new APIError(`Collection with slug ${collectionSlug} not found`)
  }

  const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`
  const isCSV = format === 'csv'

  if (debug) {
    console.log('Export configuration:', { name, isCSV, locale })
  }

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

  if (debug) {
    console.log('Find arguments:', findArgs)
  }

  let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs

  if (download) {
    if (debug) {
      console.log('Starting download stream')
    }
    const encoder = new TextEncoder()
    const stream = new Readable({
      async read() {
        let result = await payload.find(findArgs)
        let isFirstBatch = true

        while (result.docs.length > 0) {
          if (debug) {
            console.log(
              `Processing batch ${findArgs.page + 1} with ${result.docs.length} documents`,
            )
          }
          const csvInput = result.docs.map((doc) => flattenObject({ doc, fields }))
          const csvString = stringify(csvInput, { header: isFirstBatch })
          this.push(encoder.encode(csvString))
          isFirstBatch = false

          if (!result.hasNextPage) {
            if (debug) {
              console.log('Stream complete - no more pages')
            }
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

  if (debug) {
    console.log('Starting file generation')
  }
  const outputData: string[] = []
  let isFirstBatch = true

  while (result.hasNextPage) {
    findArgs.page += 1
    result = await payload.find(findArgs)

    if (debug) {
      console.log(`Processing batch ${findArgs.page} with ${result.docs.length} documents`)
    }

    if (isCSV) {
      const csvInput = result.docs.map((doc) => flattenObject({ doc, fields }))
      outputData.push(stringify(csvInput, { header: isFirstBatch }))
      isFirstBatch = false
    } else {
      const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
      outputData.push(jsonInput.join(',\n'))
    }
  }

  const buffer = Buffer.from(format === 'json' ? `[${outputData.join(',')}]` : outputData.join(''))
  if (debug) {
    console.log('File generation complete:', { bufferSize: buffer.length, format })
  }

  if (!id) {
    if (debug) {
      console.log('Creating new export file')
    }
    req.file = {
      name,
      data: buffer,
      mimetype: isCSV ? 'text/csv' : 'application/json',
      size: buffer.length,
    }
  } else {
    if (debug) {
      console.log('Updating existing export:', { id })
    }
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
  if (debug) {
    console.log('Export process completed successfully')
  }
}
