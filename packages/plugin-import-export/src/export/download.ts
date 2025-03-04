import type { PayloadHandler } from 'payload'

import { APIError } from 'payload'

import { createExport } from './createExport.js'

export const download: PayloadHandler = async (req) => {
  let body
  if (typeof req?.json === 'function') {
    body = await req.json()
  }

  if (!body || !body.data) {
    throw new APIError('Request data is required.')
  }

  req.payload.logger.info(`Download request received ${body.data.collectionSlug}`)

  body.data.user = req.user

  return createExport({
    download: true,
    input: body.data,
    req,
  }) as Promise<Response>
}
