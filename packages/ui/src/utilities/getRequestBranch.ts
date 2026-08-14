import type { PayloadRequest } from 'payload'

import { MAIN_BRANCH } from 'payload/shared'

import { getAdminPreferences } from './getAdminPreferences.js'

/**
 * Resolves the branch for an admin panel render.
 *
 * The branch is an ordinary operation argument everywhere else in Payload —
 * core never reads it from storage, so an API request that passes no branch is
 * simply on `main`. The admin panel is the one place that has to turn a
 * persisted choice into that argument, which is what this does, mirroring
 * `getRequestLocale`.
 *
 * The preference is read only when the request carries no branch of its own, and
 * only for a logged-in user. It lives in the `admin` preference alongside the
 * rest of the panel's global state, which the nav already reads on every render,
 * so resolving the branch costs no query of its own — and nothing at all for
 * front-end traffic.
 */
export async function getRequestBranch({ req }: { req: PayloadRequest }): Promise<string> {
  if (!req.payload.config.branching?.enabled) {
    return MAIN_BRANCH
  }

  const branchFromParams = req.query?.branch as string | undefined

  if (branchFromParams) {
    return branchFromParams
  }

  const { branch } = await getAdminPreferences({ req })

  return typeof branch === 'string' && branch ? branch : MAIN_BRANCH
}
