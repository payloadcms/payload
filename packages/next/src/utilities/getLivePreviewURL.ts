import type { GetLivePreviewURLArgs } from '@payloadcms/ui'
import type { ErrorResult, ServerFunction } from 'payload'

import { canAccessAdmin } from '@payloadcms/ui/shared'
import { formatErrors } from 'payload'

import { getRequestLocale } from './getRequestLocale.js'

export const getLivePreviewURLHandler: ServerFunction<
  GetLivePreviewURLArgs,
  Promise<
    | {
        url: null | string
      }
    | ErrorResult
  >
> = async (args) => {
  const { collectionSlug, data, globalSlug, req } = args

  await canAccessAdmin({ req })

  try {
    const url = req.payload.config.admin.livePreview?.url

    if (!url) {
      return { url: null }
    }

    if (typeof url === 'string') {
      return { url }
    }

    if (typeof url === 'function') {
      const locale = await getRequestLocale({
        req,
      })

      const result = await url({
        collectionConfig: req.payload.config.collections.find(
          (coll) => coll.slug === collectionSlug,
        ),
        data,
        globalConfig: globalSlug ? req.payload.globals[globalSlug] : undefined,
        locale,
        payload: req.payload,
        req,
      })

      return { url: result }
    }
  } catch (err) {
    req.payload.logger.error({ err, msg: `There was an error getting the live preview URL` })

    if (err.message === 'Unauthorized') {
      return null
    }

    return formatErrors(err)
  }
}
