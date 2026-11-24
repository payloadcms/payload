import type { PayloadRequest } from '../types/index.js'

import { isCrossSiteNavigation } from './isCrossSiteNavigation.js'

/**
 * GET endpoints that trigger actions must not trust cookie auth on cross-site navigations:
 * another site could otherwise trigger the action by navigating a signed-in user's browser.
 * Treat the navigation as unauthenticated. Access functions that check something else,
 * such as a cron secret, keep working.
 */
export const stripUserFromCrossSiteNavigation = (req: PayloadRequest): void => {
  if (req.user && isCrossSiteNavigation(req.headers)) {
    req.user = null
  }
}
