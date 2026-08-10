import type { PayloadRequest } from 'payload'

import { MAIN_BRANCH, PREFERENCE_KEYS } from 'payload/shared'

import { getPreferences } from './getPreferences.js'

/**
 * Resolves the branch for an admin panel render.
 *
 * The branch is an ordinary operation argument everywhere else in Payload —
 * core never reads it from storage, so an API request that passes no branch is
 * simply on `main`. The admin panel is the one place that has to turn a
 * persisted choice into that argument, which is what this does, mirroring
 * `getRequestLocale`.
 *
 * The preference is read only when the request carries no branch of its own,
 * and only for a logged-in user, so it costs one query per admin render and
 * nothing at all for front-end traffic.
 */
export async function getRequestBranch({ req }: { req: PayloadRequest }): Promise<string> {
  if (!req.payload.config.branching?.enabled) {
    return MAIN_BRANCH
  }

  const branchFromParams = req.query?.branch as string | undefined

  if (branchFromParams) {
    return branchFromParams
  }

  if (!req.user?.id || !req.user.collection) {
    return MAIN_BRANCH
  }

  const preference = await getPreferences<string>(
    PREFERENCE_KEYS.BRANCH,
    req.payload,
    req.user.id,
    req.user.collection,
  )

  return typeof preference?.value === 'string' && preference.value ? preference.value : MAIN_BRANCH
}
