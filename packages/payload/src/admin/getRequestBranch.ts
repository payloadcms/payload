import type { PayloadRequest } from '../types/index.js'

import { MAIN_BRANCH } from '../branching/types.js'

/** Resolves the URL branch. An unparameterized admin link always selects main. */
export function getRequestBranch({ req }: { req: PayloadRequest }): Promise<string> {
  if (!req.payload.config.branching?.enabled) {
    return Promise.resolve(MAIN_BRANCH)
  }

  const branchFromQuery = req.query?.branch

  if (typeof branchFromQuery === 'string' && branchFromQuery) {
    return Promise.resolve(branchFromQuery)
  }

  return Promise.resolve(MAIN_BRANCH)
}
