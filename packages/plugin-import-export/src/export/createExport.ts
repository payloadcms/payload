/* eslint-disable perfectionist/sort-objects */
import type { PayloadRequest, Sort, TypedUser, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { flattenObject } from './flattenObject.js'
import { getCustomFieldFunctions } from './getCustomFieldFunctions.js'
import { getFilename } from './getFilename.js'
import { getSelect } from './getSelect.js'

export type Export = {
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
  user?: TypedUser
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

  const toCSVFunctions = getCustomFieldFunctions({
    fields: collectionConfig.flattenedFields,
  })

  const disabledFieldsDot =
    collectionConfig.admin?.custom?.['plugin-import-export']?.disabledFields ?? []
  const disabledFields = disabledFieldsDot.map((f: string) => f.replace(/\./g, '_'))

  const filterDisabled = (row: Record<string, unknown>): Record<string, unknown> => {
    for (const key of disabledFields) {
      delete row[key]
    }
    return row
  }

  if (download) {
    if (debug) {
      req.payload.logger.info('Pre-scanning all columns before streaming')
    }

    const allColumnsSet = new Set<string>()
    const allColumns: string[] = []
    let scanPage = 1
    let hasMore = true

    while (hasMore) {
      const result = await payload.find({ ...findArgs, page: scanPage })

      result.docs.forEach((doc) => {
        const flat = filterDisabled(flattenObject({ doc, fields, toCSVFunctions }))
        Object.keys(flat).forEach((key) => {
          if (!allColumnsSet.has(key)) {
            allColumnsSet.add(key)
            allColumns.push(key)
          }
        })
      })

      hasMore = result.hasNextPage
      scanPage += 1
    }

    if (debug) {
      req.payload.logger.info(`Discovered ${allColumns.length} columns`)
    }

    const encoder = new TextEncoder()
    let isFirstBatch = true
    let streamPage = 1

    const stream = new Readable({
      async read() {
        const result = await payload.find({ ...findArgs, page: streamPage })

        if (debug) {
          req.payload.logger.info(`Streaming batch ${streamPage} with ${result.docs.length} docs`)
        }

        if (result.docs.length === 0) {
          this.push(null)
          return
        }

        const batchRows = result.docs.map((doc) =>
          filterDisabled(flattenObject({ doc, fields, toCSVFunctions })),
        )

        const paddedRows = batchRows.map((row) => {
          const fullRow: Record<string, unknown> = {}
          for (const col of allColumns) {
            fullRow[col] = row[col] ?? ''
          }
          return fullRow
        })

        const csvString = stringify(paddedRows, {
          header: isFirstBatch,
          columns: allColumns,
        })

        this.push(encoder.encode(csvString))
        isFirstBatch = false
        streamPage += 1

        if (!result.hasNextPage) {
          if (debug) {
            req.payload.logger.info('Stream complete - no more pages')
          }
          this.push(null) // End the stream
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

  // Non-download path (buffered export)
  if (debug) {
    req.payload.logger.info('Starting file generation')
  }

  const outputData: string[] = []
  const rows: Record<string, unknown>[] = []
  const columnsSet = new Set<string>()
  const columns: string[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      ...findArgs,
      page,
    })

    if (debug) {
      req.payload.logger.info(
        `Processing batch ${findArgs.page} with ${result.docs.length} documents`,
      )
    }

    if (isCSV) {
      const batchRows = result.docs.map((doc) =>
        filterDisabled(flattenObject({ doc, fields, toCSVFunctions })),
      )

      // Track discovered column keys
      batchRows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (!columnsSet.has(key)) {
            columnsSet.add(key)
            columns.push(key)
          }
        })
      })

      rows.push(...batchRows)
    } else {
      const jsonInput = result.docs.map((doc) => JSON.stringify(doc))
      outputData.push(jsonInput.join(',\n'))
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  if (isCSV) {
    const paddedRows = rows.map((row) => {
      const fullRow: Record<string, unknown> = {}
      for (const col of columns) {
        fullRow[col] = row[col] ?? ''
      }
      return fullRow
    })

    outputData.push(
      stringify(paddedRows, {
        header: true,
        columns,
      }),
    )
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
