import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

import type { MockExportCollectionData } from '../types.js'

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

    const data = body.data as MockExportCollectionData
    const { collectionSlug } = data || {}

    req.payload.logger.info(`Download request received ${collectionSlug}`)

    const res = await createExport({
      debug,
      download: true,
      input: { ...data },
      req,
      user: req.user,
    })

    return res as Response
  } catch (err) {
    // Return JSON for front-end toast
    return new Response(
      JSON.stringify({ errors: [{ message: (err as Error).message || 'Something went wrong' }] }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 },
    )
  }
}
