import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

import { createExport } from './createExport.js'

export const download = async (req: PayloadRequest, debug = false) => {
  try {
    let body
    if (typeof req?.json === 'function') {
      body = await req.json()
    }

    if (!body || !body.data) {
      throw new APIError('Request data is required.')
    }

    req.payload.logger.info(`Download request received ${body.data.collectionSlug}`)

    body.data.user = req.user

    if (typeof body.data.limit === 'number' && body.data.limit % 100 !== 0) {
      throw new APIError(`Limit must be a multiple of 100`)
    }

    return createExport({
      download: true,
      input: { ...body.data, debug },
      req,
    }) as Promise<Response>
  } catch (err) {
    // Catch the error and send JSON with message explicitly
    return new Response(
      JSON.stringify({ errors: [{ message: (err as Error).message || 'Something went wrong' }] }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 },
    )
  }
}
