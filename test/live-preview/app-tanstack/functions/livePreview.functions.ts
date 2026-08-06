import { createServerFn } from '@tanstack/react-start'

export const getLivePreviewDoc = createServerFn({ method: 'GET' })
  .validator((data: { collection: string; slug: string }) => data)
  .handler(async ({ data: { slug, collection } }) => {
    const config = (await import('@payload-config')).default
    const { getPayload } = await import('payload')
    const { toSerializable } = await import('@payloadcms/tanstack-start/server')
    const payload = await getPayload({ config })

    try {
      const { docs } = await payload.find({
        overrideAccess: true,
        collection,
        depth: 2,
        draft: true,
        trash: true,
        where: { slug: { equals: slug } },
      })

      return docs[0] ? toSerializable({ ...docs[0] }, {}) : null
    } catch {
      return null
    }
  })
