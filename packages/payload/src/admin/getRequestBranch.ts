import type { PayloadRequest } from '../types/index.js'

import { MAIN_BRANCH } from '../branching/types.js'
import { getAdminPreferences } from './getAdminPreferences.js'

/** Resolves the branch selected for an admin panel render. */
export async function getRequestBranch({ req }: { req: PayloadRequest }): Promise<string> {
  if (!req.payload.config.branching?.enabled) {
    return MAIN_BRANCH
  }

  const branchFromQuery = req.query?.branch

  if (typeof branchFromQuery === 'string' && branchFromQuery) {
    return branchFromQuery
  }

  const { branch } = await getAdminPreferences({ req })

  return typeof branch === 'string' && branch ? branch : MAIN_BRANCH
}
