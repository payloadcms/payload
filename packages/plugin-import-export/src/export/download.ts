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

    const { collectionSlug, limit } = body.data || {}

    req.payload.logger.info(`Download request received ${collectionSlug}`)
    body.data.user = req.user

    if (limit && limit < 0) {
      const error = new APIError('Invalid limit')
      req.payload.logger.error(error)
      throw error
    }

    if (limit && limit % 100 !== 0) {
      const error = new APIError('Limit must be a multiple of 100')
      req.payload.logger.error(error)
      throw error
    }

    return createExport({
      download: true,
      input: { ...body.data, debug },
      req,
    }) as Promise<Response>
  } catch (err) {
    // Return JSON for front-end toast
    return new Response(
      JSON.stringify({ errors: [{ message: (err as Error).message || 'Something went wrong' }] }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 },
    )
  }
}
