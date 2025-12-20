import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

export type ParseJSONArgs = {
  data: Buffer | string
  req: PayloadRequest
}

/**
 * Parses JSON data into an array of record objects.
 * Validates that the input is an array of documents.
 */
export const parseJSON = ({ data, req }: ParseJSONArgs): Record<string, unknown>[] => {
  try {
    const content = typeof data === 'string' ? data : data.toString('utf-8')
    const parsed = JSON.parse(content)

    if (!Array.isArray(parsed)) {
      throw new APIError('JSON import data must be an array of documents')
    }

    return parsed
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Error parsing JSON' })
    if (err instanceof APIError) {
      throw err
    }
    throw new APIError('Invalid JSON format')
  }
}
