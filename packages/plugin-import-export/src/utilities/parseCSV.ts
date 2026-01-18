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
        // Empty strings should be undefined (field not present in update)
        // This preserves existing data instead of overwriting with null
        if (value === '') {
          return undefined
        }

        // Handle booleans
        if (value === 'true') {
          return true
        }
        if (value === 'false') {
          return false
        }

        // Handle explicit null - user must type "null" to set field to null
        if (value === 'null' || value === 'NULL') {
          return null
        }

        // Don't auto-convert to numbers if the value contains a comma
        // This allows hasMany fields to use comma-separated values
        if (value.includes(',')) {
          return value // Keep as string for comma-separated values
        }

        // Handle numbers (only after checking for commas)
        if (!isNaN(Number(value)) && value !== '') {
          const num = Number(value)

          if (String(num) === value || value.includes('.')) {
            return num
          }
        }

        // Return as string
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
