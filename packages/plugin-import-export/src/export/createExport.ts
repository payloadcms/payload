/* eslint-disable perfectionist/sort-objects */
import type { PayloadRequest, Sort, TypedUser, Where } from 'payload'

import { stringify } from 'csv-stringify/sync'
import { APIError } from 'payload'
import { Readable } from 'stream'

import { buildDisabledFieldRegex } from '../utilities/buildDisabledFieldRegex.js'
import { validateLimitValue } from '../utilities/validateLimitValue.js'
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
  limit?: number
  locale?: string
  name: string
  page?: number
  slug: string
  sort: Sort
  where?: Where
}

export type CreateExportArgs = {
  /**
   * If true, stream the file instead of saving it
   */
  download?: boolean
  input: Export
  req: PayloadRequest
  user?: null | TypedUser
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
      page,
      limit: incomingLimit,
      where,
    },
    req: { locale: localeArg, payload },
    req,
    user,
  } = args

  if (!user) {
    throw new APIError('User authentication is required to create exports')
  }

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

  const batchSize = 100 // fixed per request

  const hardLimit =
    typeof incomingLimit === 'number' && incomingLimit > 0 ? incomingLimit : undefined

  const { totalDocs } = await payload.count({
    collection: collectionSlug,
    user,
    locale,
    overrideAccess: false,
  })

  const totalPages = Math.max(1, Math.ceil(totalDocs / batchSize))
  const requestedPage = page || 1
  const adjustedPage = requestedPage > totalPages ? 1 : requestedPage

  const findArgs = {
    collection: collectionSlug,
    depth: 1,
    draft: drafts === 'yes',
    limit: batchSize,
    locale,
    overrideAccess: false,
    page: 0, // The page will be incremented manually in the loop
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

    const limitErrorMsg = validateLimitValue(
      incomingLimit,
      req.t,
      batchSize, // step i.e. 100
    )
    if (limitErrorMsg) {
      throw new APIError(limitErrorMsg)
    }

    const allColumns: string[] = []

    if (isCSV) {
      const allColumnsSet = new Set<string>()

      // Use the incoming page value here, defaulting to 1 if undefined
      let scanPage = adjustedPage
      let hasMore = true
      let fetched = 0
      const maxDocs = typeof hardLimit === 'number' ? hardLimit : Number.POSITIVE_INFINITY

      while (hasMore) {
        const remaining = Math.max(0, maxDocs - fetched)
        if (remaining === 0) {
          break
        }

        const result = await payload.find({
          ...findArgs,
          page: scanPage,
          limit: Math.min(batchSize, remaining),
        })

        result.docs.forEach((doc) => {
          const flat = filterDisabledCSV(flattenObject({ doc, fields, toCSVFunctions }))
          Object.keys(flat).forEach((key) => {
            if (!allColumnsSet.has(key)) {
              allColumnsSet.add(key)
              allColumns.push(key)
            }
          })
        })

        fetched += result.docs.length
        scanPage += 1 // Increment page for next batch
        hasMore = result.hasNextPage && fetched < maxDocs
      }

      if (debug) {
        req.payload.logger.debug(`Discovered ${allColumns.length} columns`)
      }
    }

    const encoder = new TextEncoder()
    let isFirstBatch = true
    let streamPage = adjustedPage
    let fetched = 0
    const maxDocs = typeof hardLimit === 'number' ? hardLimit : Number.POSITIVE_INFINITY

    const stream = new Readable({
      async read() {
        const remaining = Math.max(0, maxDocs - fetched)

        if (remaining === 0) {
          if (!isCSV) {
            this.push(encoder.encode(']'))
          }
          this.push(null)
          return
        }

        const result = await payload.find({
          ...findArgs,
          page: streamPage,
          limit: Math.min(batchSize, remaining),
        })

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

          // Add UTF-8 BOM for Excel compatibility on Windows
          if (isFirstBatch) {
            this.push(new Uint8Array([0xef, 0xbb, 0xbf]))
          }

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

        fetched += result.docs.length
        isFirstBatch = false
        streamPage += 1 // Increment stream page for the next batch

        if (!result.hasNextPage || fetched >= maxDocs) {
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
        'Content-Type': isCSV ? 'text/csv; charset=utf-8' : 'application/json',
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

  // Start from the incoming page value, defaulting to 1 if undefined
  let currentPage = adjustedPage
  let fetched = 0
  let hasNextPage = true
  const maxDocs = typeof hardLimit === 'number' ? hardLimit : Number.POSITIVE_INFINITY

  while (hasNextPage) {
    const remaining = Math.max(0, maxDocs - fetched)

    if (remaining === 0) {
      break
    }

    const result = await payload.find({
      ...findArgs,
      page: currentPage,
      limit: Math.min(batchSize, remaining),
    })

    if (debug) {
      req.payload.logger.debug(
        `Processing batch ${currentPage} with ${result.docs.length} documents`,
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

    fetched += result.docs.length
    hasNextPage = result.hasNextPage && fetched < maxDocs
    currentPage += 1 // Increment page for next batch
  }

  // Prepare final output
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

  const buffer = Buffer.from(
    format === 'json' ? `[${outputData.join(',')}]` : '\uFEFF' + outputData.join(''),
  )
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
      mimetype: isCSV ? 'text/csv; charset=utf-8' : 'application/json',
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
        mimetype: isCSV ? 'text/csv; charset=utf-8' : 'application/json',
        size: buffer.length,
      },
      user,
    })
  }
  if (debug) {
    req.payload.logger.debug('Export process completed successfully')
  }
}
