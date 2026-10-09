import type { NavPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'
import { cache } from 'react'

import { getAdminPreferences } from '../../utilities/getAdminPreferences.js'
import { getPreferences } from '../../utilities/getPreferences.js'

/**
 * Assembles the nav's view of the user's preferences.
 *
 * The group and open state come from the shared `admin` preference, so this is
 * the same read that resolved the request's branch rather than a second query.
 */
export const getNavPrefs = cache(async (req: PayloadRequest): Promise<NavPreferences> => {
  if (!req?.user?.collection) {
    return { activeTab: undefined, groups: {}, open: true }
  }

  const adminPrefs = await getAdminPreferences({ req })

  const sidebarPrefs = await getPreferences<{ activeTab?: string }>(
    PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB,
    req.payload,
    req.user.id,
    req.user.collection,
  ).then((res) => res?.value)

  return {
    activeTab: sidebarPrefs?.activeTab,
    groups: adminPrefs.groups ?? {},
    open: adminPrefs.open ?? true,
  }
})
