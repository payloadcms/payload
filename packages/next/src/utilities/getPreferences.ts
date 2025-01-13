import type { Payload, User } from 'payload'

import { cache } from 'react'

export const getPreferences = cache(
  async <T>(key: string, payload: Payload, user: User): Promise<T> => {
    let result: T = null

    try {
      result = await payload
        .find({
          collection: 'payload-preferences',
          depth: 0,
          limit: 1,
          user,
          where: {
            and: [
              {
                'user.relationTo': {
                  equals: payload.config.admin.user,
                },
              },
              {
                'user.value': {
                  equals: user.id,
                },
              },
              {
                key: {
                  equals: key,
                },
              },
            ],
          },
        })
        ?.then((res) => res.docs?.[0]?.value as T)
    } catch (_err) {} // eslint-disable-line no-empty

    return result
  },
)
