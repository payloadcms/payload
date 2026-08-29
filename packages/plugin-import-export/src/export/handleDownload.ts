import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

import type { ExportDoc } from '../types.js'

import { getSubmittedFormValues } from '../utilities/getSubmittedFormValues.js'
import { resolveLimit } from '../utilities/resolveLimit.js'
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
    let maxLimit: number | undefined

    if (targetCollection) {
      const adminPluginConfig = targetCollection.config.admin?.custom?.['plugin-import-export']
      const pluginConfig = targetCollection.config.custom?.['plugin-import-export']

      const forcedFormat = adminPluginConfig?.exportFormat
      if (forcedFormat && format && format !== forcedFormat) {
        throw new APIError(
          `Export format '${format}' is not supported for collection '${collectionSlug}'. Only '${forcedFormat}' format is allowed.`,
        )
      }

      // Resolve max limit from the collection config
      maxLimit = await resolveLimit({
        limit: pluginConfig?.exportLimit,
        req,
      })
    }

    const { user } = req

    body.data.userID = user?.id
    body.data.userCollection = user?.collection

    const res = await createExport({
      ...body.data,
      debug,
      download: true,
      // Downloads are streamed and never persisted, so there is no export document. The
      // submitted form data carries every user-authored field; `getSubmittedFormValues` drops
      // `id`, so a hook can rely on an absent `id` meaning "not saved".
      exportDoc: getSubmittedFormValues({
        formData: body.data as Record<string, unknown>,
      }) as ExportDoc,
      maxLimit,
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
