import type { PayloadRequest } from 'payload'

import { parse } from 'csv-parse'

export type ParseCSVArgs = {
  data: Buffer | string
  req: PayloadRequest
}

/**
 * Parses CSV data into an array of record objects.
 * Handles type coercion for booleans, numbers, and null values.
 */
export const parseCSV = async ({ data, req }: ParseCSVArgs): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const records: Record<string, unknown>[] = []

    const parser = parse({
      cast: (value, _context) => {
        // Empty strings become undefined to preserve existing data during updates
        if (value === '') {
          return undefined
        }

        if (value === 'true') {
          return true
        }
        if (value === 'false') {
          return false
        }

        // Explicit null requires typing "null" or "NULL"
        if (value === 'null' || value === 'NULL') {
          return null
        }

        // Keep comma-separated values as strings for hasMany fields
        if (value.includes(',')) {
          return value
        }

        if (!isNaN(Number(value)) && value !== '') {
          const num = Number(value)
          if (String(num) === value || value.includes('.')) {
            return num
          }
        }

        return value
      },
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    parser.on('readable', () => {
      let record
      while ((record = parser.read()) !== null) {
        records.push(record)
      }
    })

    parser.on('error', (err) => {
      req.payload.logger.error({ err, msg: 'Error parsing CSV' })
      reject(err)
    })

    parser.on('end', () => {
      resolve(records)
    })

    parser.write(data)
    parser.end()
  })
}
