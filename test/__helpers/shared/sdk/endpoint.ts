import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import { addDataAndFileToRequest } from 'payload'

/**
 * Args arrive as JSON, which turns an upload's `file.data` Buffer into `{ type: 'Buffer', data: [...] }`.
 * Rebuild it so the Local API gets the actual bytes.
 */
const reviveFileData = (args: Record<string, unknown>): Record<string, unknown> => {
  const { file } = args

  if (
    typeof file === 'object' &&
    file !== null &&
    'data' in file &&
    typeof file.data === 'object' &&
    file.data !== null &&
    'type' in file.data &&
    file.data.type === 'Buffer' &&
    'data' in file.data &&
    Array.isArray(file.data.data)
  ) {
    return { ...args, file: { ...file, data: Buffer.from(file.data.data) } }
  }

  return args
}

export const handler: PayloadHandler = async (req) => {
  await addDataAndFileToRequest(req)

  const { data, payload, user } = req

  const operation = data?.operation ? String(data.operation) : undefined

  if (data?.operation && typeof payload[operation] === 'function') {
    try {
      const result = await payload[operation]({
        ...reviveFileData(typeof data.args === 'object' && data.args !== null ? data.args : {}),
        user,
      })

      return Response.json(result, {
        status: httpStatus.OK,
      })
    } catch (err) {
      payload.logger.error(err)
      // An Error's `message` isn't enumerable, so JSON would drop it.
      return Response.json(err instanceof Error ? { ...err, message: err.message } : err, {
        status: httpStatus.BAD_REQUEST,
      })
    }
  }

  return Response.json(
    {
      message: 'Payload Local API method not found.',
    },
    {
      status: httpStatus.BAD_REQUEST,
    },
  )
}

export const localAPIEndpoint: Endpoint = {
  path: '/local-api',
  method: 'post',
  handler,
}
