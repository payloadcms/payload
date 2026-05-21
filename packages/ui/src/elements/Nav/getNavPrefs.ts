import type { NavPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'

const navPrefsCache = new WeakMap<PayloadRequest, Promise<NavPreferences>>()

export const getNavPrefs = (req: PayloadRequest): Promise<NavPreferences> => {
  if (navPrefsCache.has(req)) {
    return navPrefsCache.get(req)
  }

  const result = (async (): Promise<NavPreferences> => {
    if (!req?.user?.collection) {
      return { activeTab: undefined, groups: {}, open: true }
    }

    const navPrefs = await req.payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        pagination: false,
        req,
        where: {
          and: [
            { key: { equals: PREFERENCE_KEYS.NAV } },
            { 'user.relationTo': { equals: req.user.collection } },
            { 'user.value': { equals: req?.user?.id } },
          ],
        },
      })
      ?.then((res) => res?.docs?.[0]?.value as NavPreferences | undefined)

    const sidebarPrefs = await req.payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        pagination: false,
        req,
        where: {
          and: [
            { key: { equals: PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB } },
            { 'user.relationTo': { equals: req.user.collection } },
            { 'user.value': { equals: req?.user?.id } },
          ],
        },
      })
      ?.then((res) => res?.docs?.[0]?.value as { activeTab?: string } | undefined)

    return {
      activeTab: sidebarPrefs?.activeTab,
      groups: navPrefs?.groups ?? {},
      open: navPrefs?.open ?? true,
    }
  })()

  navPrefsCache.set(req, result)

  return result
}
