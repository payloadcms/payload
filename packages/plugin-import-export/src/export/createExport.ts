/* eslint-disable perfectionist/sort-objects */
import type { PaginatedDocs, PayloadRequest, Sort, User, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { flattenObject } from './flattenObject.js'
import { getCustomFieldFunctions } from './getCustomFieldFunctions.js'
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

  if (debug) {
    req.payload.logger.info({
      message: 'Starting export process with args:',
      collectionSlug,
      drafts,
      fields,
      format,
    })
  }

  const locale = localeInput ?? localeArg
  const collectionConfig = payload.config.collections.find(({ slug }) => slug === collectionSlug)
  if (!collectionConfig) {
    throw new APIError(`Collection with slug ${collectionSlug} not found`)
  }

  const name = `${nameArg ?? `${getFilename()}-${collectionSlug}`}.${format}`
  const isCSV = format === 'csv'
  const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined

  if (debug) {
    req.payload.logger.info({ message: 'Export configuration:', name, isCSV, locale })
  }

  const findArgs = {
    collection: collectionSlug,
    depth: 1,
    draft: drafts === 'yes',
    limit: 100,
    locale,
    overrideAccess: false,
    page: 0,
    select,
    sort,
    user,
    where,
  }

  if (debug) {
    req.payload.logger.info({ message: 'Find arguments:', findArgs })
  }

  let result: PaginatedDocs = { hasNextPage: true } as PaginatedDocs

  const toCSVFunctions = getCustomFieldFunctions({
    fields: collectionConfig.flattenedFields,
    select,
  })

  if (download) {
    if (debug) {
      req.payload.logger.info('Starting download stream')
    }
    const encoder = new TextEncoder()
    const stream = new Readable({
      async read() {
        let result = await payload.find(findArgs)
        let isFirstBatch = true

        while (result.docs.length > 0) {
          if (debug) {
            req.payload.logger.info(
              `Processing batch ${findArgs.page + 1} with ${result.docs.length} documents`,
            )
          }
          const csvInput = result.docs.map((doc) => flattenObject({ doc, fields, toCSVFunctions }))
          const csvString = stringify(csvInput, { header: isFirstBatch })
          this.push(encoder.encode(csvString))
          isFirstBatch = false

          if (!result.hasNextPage) {
            if (debug) {
              req.payload.logger.info('Stream complete - no more pages')
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
    req.payload.logger.info('Starting file generation')
  }
  const outputData: string[] = []
  let isFirstBatch = true

  while (result.hasNextPage) {
    findArgs.page += 1
    result = await payload.find(findArgs)

    if (debug) {
      req.payload.logger.info(
        `Processing batch ${findArgs.page} with ${result.docs.length} documents`,
      )
    }

    if (isCSV) {
      const csvInput = result.docs.map((doc) => flattenObject({ doc, fields, toCSVFunctions }))
      outputData.push(stringify(csvInput, { header: isFirstBatch }))
      isFirstBatch = false
    } else {
      const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
      outputData.push(jsonInput.join(',\n'))
    }
  }

  const buffer = Buffer.from(format === 'json' ? `[${outputData.join(',')}]` : outputData.join(''))
  if (debug) {
    req.payload.logger.info(`${format} file generation complete`)
  }

  if (!id) {
    if (debug) {
      req.payload.logger.info('Creating new export file')
    }
    req.file = {
      name,
      data: buffer,
      mimetype: isCSV ? 'text/csv' : 'application/json',
      size: buffer.length,
    }
  } else {
    if (debug) {
      req.payload.logger.info(`Updating existing export with id: ${id}`)
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
    req.payload.logger.info('Export process completed successfully')
  }
}
