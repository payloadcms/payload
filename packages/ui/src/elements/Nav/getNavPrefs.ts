import type { NavPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'
import { cache } from 'react'

export const getNavPrefs = cache(async (req: PayloadRequest): Promise<NavPreferences> => {
  if (!req?.user?.collection) {
    return { activeTab: undefined, groups: {}, open: true }
  }

  // Navigation renders alongside document creation and must not join its transaction.
  const preferencesReq = { ...req, transactionID: undefined }

  const navPrefs = await req.payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req: preferencesReq,
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
      overrideAccess: true,
      pagination: false,
      req: preferencesReq,
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
