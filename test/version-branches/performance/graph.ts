import type { PayloadRequest, Where } from 'payload'

import { performanceSlug } from './scenarios.js'

/** Released draft adapter reads with equivalent bounded BFS, actor policy, locale and page. */
export const queryLegacyPerformanceGraph = async ({
  req,
  where,
}: {
  req: PayloadRequest
  where: Where
}) => {
  const denied = req.context.performanceDeniedOrdinals as number[]
  const policy: Where = {
    and: [
      { 'version.ordinal': { greater_than_equal: 0 } },
      { 'version.ordinal': { not_in: denied } },
    ],
  }
  const result = await req.payload.db.queryDrafts({
    collection: performanceSlug,
    locale: 'en',
    limit: 20,
    page: 1,
    pagination: true,
    req,
    sort: 'version.ordinal',
    where: { and: [policy, where] },
  })
  const rows = new Map<string, null | Record<string, unknown>>()
  let frontier = result.docs

  for (let level = 0; level <= 2; level++) {
    for (const doc of frontier) {
      rows.set(String(doc.id), doc)
    }
    if (level === 2) {
      break
    }
    const requested = [
      ...new Set(frontier.flatMap((doc) => (doc as Record<string, unknown>).related as string[])),
    ].filter((id) => !rows.has(id))

    frontier = []
    for (let start = 0; start < requested.length; start += 50) {
      const batch = requested.slice(start, start + 50)
      const related = await req.payload.db.queryDrafts({
        collection: performanceSlug,
        locale: 'en',
        limit: 0,
        pagination: false,
        req,
        where: { and: [policy, { parent: { in: batch } }] },
      })
      const returned = new Map(related.docs.map((doc) => [String(doc.id), doc]))

      for (const id of batch) {
        const doc = returned.get(id) ?? null

        rows.set(id, doc)
        if (doc) {
          frontier.push(doc)
        }
      }
    }
  }
  return { result, rows }
}
