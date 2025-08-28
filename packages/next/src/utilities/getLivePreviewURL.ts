import type { CollectionSlug, ServerFunction } from 'payload'

import { canAccessAdmin } from '@payloadcms/ui/shared'
import { formatErrors } from 'payload'

export const getLivePreviewURLHandler: ServerFunction<
  {
    collectionSlug: CollectionSlug
    globalSlug?: string
  },
  Promise<{
    url: null | string
  }>
> = async (args) => {
  console.log('OK BOYS AND GIURLS')
  const { collectionSlug, globalSlug, req } = args

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
      const result = await url({
        collectionConfig: req.payload.config.collections.find(
          (coll) => coll.slug === collectionSlug,
        ),
        data: undefined, // TODO
        globalConfig: globalSlug ? req.payload.globals[globalSlug] : undefined,
        locale: req.locale,
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
