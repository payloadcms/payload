import { createServerFn } from '@tanstack/react-start'

export const getPublishedPosts = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ default: config }, { getPayload }] = await Promise.all([
    import('@payload-config'),
    import('payload'),
  ])
  const payload = await getPayload({ config })

  return payload.find({
    collection: 'posts',
    depth: 0,
    limit: 12,
    overrideAccess: false,
    sort: '-publishedAt',
  })
})
