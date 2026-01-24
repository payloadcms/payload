import { status as httpStatus } from 'http-status'

import { parseRangeHeader } from './parseRangeHeader.js'

export type RangeRequestResult =
  | {
      headers: {
        'Accept-Ranges': string
        'Content-Length': string
        'Content-Range'?: string
      }
      rangeEnd: number
      rangeStart: number
      status: 206
      type: 'partial'
    }
  | {
      headers: {
        'Accept-Ranges': string
        'Content-Length': string
      }
      status: 200
      type: 'full'
    }
  | {
      headers: {
        'Content-Range': string
      }
      status: 416
      type: 'invalid'
    }

/**
 * Gets HTTP Range request information according to RFC 7233
 *
 * @param fileSize - The total size of the file in bytes
 * @param rangeHeader - The Range header value from the request (e.g., "bytes=0-1023")
 * @returns Result object with headers and status code for the response
 */
export function getRangeRequestInfo({
  fileSize,
  rangeHeader,
}: {
  fileSize: number
  rangeHeader: null | string
}): RangeRequestResult {
  // Parse the Range header
  const rangeResult = parseRangeHeader({
    fileSize,
    rangeHeader,
  })

  // Handle invalid range
  if (rangeResult.type === 'invalid') {
    return {
      type: 'invalid',
      headers: {
        'Content-Range': `bytes */${fileSize}`,
      },
      status: httpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    }
  }

  // Handle partial range request
  if (rangeResult.type === 'partial' && rangeResult.range) {
    const { end, start } = rangeResult.range
    const contentLength = end - start + 1

    return {
      type: 'partial',
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(contentLength),
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      },
      rangeEnd: end,
      rangeStart: start,
      status: httpStatus.PARTIAL_CONTENT,
    }
  }

  // Handle full file request (no range or invalid)
  return {
    type: 'full',
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
    },
    status: httpStatus.OK,
  }
}
