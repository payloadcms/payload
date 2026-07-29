import { createServerFn } from '@tanstack/react-start'

export const getLivePreviewDoc = createServerFn({ method: 'GET' })
  .validator((data: { collection: string; slug: string }) => data)
  .handler(async ({ data: { slug, collection } }) => {
    const config = (await import('@payload-config')).default
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config })

    try {
      const { docs } = await payload.find({
        collection: collection as any,
        depth: 2,
        draft: true,
        trash: true,
        where: { slug: { equals: slug } },
      })

      return (docs[0] ?? null) as null | Record<string, unknown>
    } catch {
      return null
    }
  })
