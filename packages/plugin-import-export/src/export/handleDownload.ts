import type { PayloadRequest } from '@ruya.sa/payload'

import { APIError } from '@ruya.sa/payload'

import { createExport } from './createExport.js'

export const handleDownload = async (req: PayloadRequest, debug = false) => {
  try {
    let body

    if (typeof req?.json === 'function') {
      body = await req.json()
    }

    if (!body || !body.data) {
      throw new APIError('Request data is required.')
    }

    const { collectionSlug } = body.data || {}

    req.payload.logger.info(`Download request received ${collectionSlug}`)

    const { user } = req

    body.data.userID = user?.id || user?.user?.id
    body.data.userCollection = user?.collection || user?.user?.collection

    const res = await createExport({
      ...body.data,
      debug,
      download: true,
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
