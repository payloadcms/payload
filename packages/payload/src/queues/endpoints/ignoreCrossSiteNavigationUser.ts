import type { PayloadRequest } from '../../types/index.js'

import { isCrossSiteNavigation } from '../../auth/isCrossSiteNavigation.js'

/**
 * The jobs endpoints use GET (for Vercel Cron) but change state. Cookie auth is accepted on
 * cross-site top-level navigations, so another site could otherwise make a signed-in user's
 * browser run jobs just by linking here. Such a navigation can only carry the session cookie,
 * so treat it as unauthenticated. Access functions that check something else, such as a cron
 * secret, keep working.
 */
export const ignoreCrossSiteNavigationUser = (req: PayloadRequest): void => {
  if (req.user && isCrossSiteNavigation(req.headers)) {
    req.user = null
  }
}
