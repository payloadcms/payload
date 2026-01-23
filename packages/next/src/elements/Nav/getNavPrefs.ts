import type { NavPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload'
import { cache } from 'react'

export const getNavPrefs = cache(async (req: PayloadRequest): Promise<NavPreferences> => {
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
          {
            key: {
              equals: PREFERENCE_KEYS.NAV,
            },
          },
          {
            'user.relationTo': {
              equals: req.user.collection,
            },
          },
          {
            'user.value': {
              equals: req?.user?.id,
            },
          },
        ],
      },
    })
    ?.then((res) => res?.docs?.[0]?.value)

  const sidebarPrefs = await req.payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        and: [
          {
            key: {
              equals: PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB,
            },
          },
          {
            'user.relationTo': {
              equals: req.user.collection,
            },
          },
          {
            'user.value': {
              equals: req?.user?.id,
            },
          },
        ],
      },
    })
    ?.then((res) => res?.docs?.[0]?.value)

  return {
    activeTab: sidebarPrefs?.activeTab,
    groups: navPrefs?.groups ?? {},
    open: navPrefs?.open ?? true,
  }
})
