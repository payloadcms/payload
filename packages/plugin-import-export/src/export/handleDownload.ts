import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

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

    const { collectionSlug, format } = body.data || {}

    req.payload.logger.info(`Download request received ${collectionSlug}`)

    const targetCollection = req.payload.collections[collectionSlug]
    if (targetCollection) {
      const forcedFormat =
        targetCollection.config.admin?.custom?.['plugin-import-export']?.exportFormat
      if (forcedFormat && format && format !== forcedFormat) {
        throw new APIError(
          `Export format '${format}' is not supported for collection '${collectionSlug}'. Only '${forcedFormat}' format is allowed.`,
        )
      }
    }

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
