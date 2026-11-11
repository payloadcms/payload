import type { PayloadRequest } from '../types/index.js'

import { branchesCollectionSlug, MAIN_BRANCH } from '../branching/types.js'

/** Resolves the URL branch. An unparameterized admin link always selects main. */
export async function getRequestBranch({ req }: { req: PayloadRequest }): Promise<string> {
  if (!req.payload.config.branching?.enabled) {
    return MAIN_BRANCH
  }

  const branchFromQuery = req.query?.branch

  if (typeof branchFromQuery === 'string' && branchFromQuery) {
    if (branchFromQuery !== MAIN_BRANCH && req.user && req.url && req.server) {
      const { docs } = await req.payload.find({
        collection: branchesCollectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        req,
        select: { id: true },
        user: req.user,
        where: { name: { equals: branchFromQuery } },
      })

      if (!docs.length) {
        const url = new URL(req.url)

        url.searchParams.delete('branch')

        // Redirect before rendering or running an action against a different workspace.
        req.server.redirect(`${url.pathname}${url.search}${url.hash}`)
      }
    }

    return branchFromQuery
  }

  return MAIN_BRANCH
}
