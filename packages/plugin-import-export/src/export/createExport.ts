/* eslint-disable perfectionist/sort-objects */
import type { PayloadRequest, Sort, TypedUser, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { buildDisabledFieldRegex } from '../utilities/buildDisabledFieldRegex.js'
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
    req.payload.logger.debug({
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
    req.payload.logger.debug({ message: 'Export configuration:', name, isCSV, locale })
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
    req.payload.logger.debug({ message: 'Find arguments:', findArgs })
  }

  const toCSVFunctions = getCustomFieldFunctions({
    fields: collectionConfig.flattenedFields,
  })

  const disabledFields =
    collectionConfig.admin?.custom?.['plugin-import-export']?.disabledFields ?? []

  const disabledRegexes: RegExp[] = disabledFields.map(buildDisabledFieldRegex)

  const filterDisabledCSV = (row: Record<string, unknown>): Record<string, unknown> => {
    const filtered: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(row)) {
      const isDisabled = disabledRegexes.some((regex) => regex.test(key))
      if (!isDisabled) {
        filtered[key] = value
      }
    }

    return filtered
  }

  const filterDisabledJSON = (doc: any, parentPath = ''): any => {
    if (Array.isArray(doc)) {
      return doc.map((item) => filterDisabledJSON(item, parentPath))
    }

    if (typeof doc !== 'object' || doc === null) {
      return doc
    }

    const filtered: Record<string, any> = {}
    for (const [key, value] of Object.entries(doc)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key

      // Only remove if this exact path is disabled
      const isDisabled = disabledFields.includes(currentPath)

      if (!isDisabled) {
        filtered[key] = filterDisabledJSON(value, currentPath)
      }
    }

    return filtered
  }

  if (download) {
    if (debug) {
      req.payload.logger.debug('Pre-scanning all columns before streaming')
    }

    const allColumns: string[] = []

    if (isCSV) {
      const allColumnsSet = new Set<string>()
      let scanPage = 1
      let hasMore = true

      while (hasMore) {
        const result = await payload.find({ ...findArgs, page: scanPage })

        result.docs.forEach((doc) => {
          const flat = filterDisabledCSV(flattenObject({ doc, fields, toCSVFunctions }))
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
        req.payload.logger.debug(`Discovered ${allColumns.length} columns`)
      }
    }

    const encoder = new TextEncoder()
    let isFirstBatch = true
    let streamPage = 1

    const stream = new Readable({
      async read() {
        const result = await payload.find({ ...findArgs, page: streamPage })

        if (debug) {
          req.payload.logger.debug(`Streaming batch ${streamPage} with ${result.docs.length} docs`)
        }

        if (result.docs.length === 0) {
          // Close JSON array properly if JSON
          if (!isCSV) {
            this.push(encoder.encode(']'))
          }
          this.push(null)
          return
        }

        if (isCSV) {
          // --- CSV Streaming ---
          const batchRows = result.docs.map((doc) =>
            filterDisabledCSV(flattenObject({ doc, fields, toCSVFunctions })),
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
        } else {
          // --- JSON Streaming ---
          const batchRows = result.docs.map((doc) => filterDisabledJSON(doc))

          // Convert each filtered/flattened row into JSON string
          const batchJSON = batchRows.map((row) => JSON.stringify(row)).join(',')

          if (isFirstBatch) {
            this.push(encoder.encode('[' + batchJSON))
          } else {
            this.push(encoder.encode(',' + batchJSON))
          }
        }

        isFirstBatch = false
        streamPage += 1

        if (!result.hasNextPage) {
          if (debug) {
            req.payload.logger.debug('Stream complete - no more pages')
          }
          if (!isCSV) {
            this.push(encoder.encode(']'))
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
    req.payload.logger.debug('Starting file generation')
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
      req.payload.logger.debug(
        `Processing batch ${findArgs.page} with ${result.docs.length} documents`,
      )
    }

    if (isCSV) {
      const batchRows = result.docs.map((doc) =>
        filterDisabledCSV(flattenObject({ doc, fields, toCSVFunctions })),
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
      const batchRows = result.docs.map((doc) => filterDisabledJSON(doc))
      outputData.push(batchRows.map((doc) => JSON.stringify(doc)).join(',\n'))
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
    req.payload.logger.debug(`${format} file generation complete`)
  }

  if (!id) {
    if (debug) {
      req.payload.logger.debug('Creating new export file')
    }
    req.file = {
      name,
      data: buffer,
      mimetype: isCSV ? 'text/csv' : 'application/json',
      size: buffer.length,
    }
  } else {
    if (debug) {
      req.payload.logger.debug(`Updating existing export with id: ${id}`)
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
    req.payload.logger.debug('Export process completed successfully')
  }
}
