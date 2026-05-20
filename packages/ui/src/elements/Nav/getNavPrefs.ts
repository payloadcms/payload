import type { NavPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'

const navPrefsCache = new WeakMap<PayloadRequest, Promise<NavPreferences>>()

export const getNavPrefs = (req: PayloadRequest): Promise<NavPreferences> => {
  if (navPrefsCache.has(req)) {
    return navPrefsCache.get(req)
  }

  const result = req?.user?.collection
    ? req.payload
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
    : Promise.resolve(null)

  navPrefsCache.set(req, result)

  return result
}
