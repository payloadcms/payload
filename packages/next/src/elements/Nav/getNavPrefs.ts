import type { NavPreferences, Payload, PayloadRequest, User } from 'payload'

import { cache } from 'react'

export const getNavPrefs = cache(
  async ({
    payload,
    req,
    user,
  }: {
    payload: Payload
    req: PayloadRequest
    user: User
  }): Promise<NavPreferences> =>
    user
      ? await payload
          .findPreferenceByKey({
            key: 'nav',
            req: {
              ...(req || ({} as PayloadRequest)),
              payload, // do this for backward compatibility, `req` is a _new_ argument, but `payload` is not
            },
            user,
          })
          ?.then((res) => res?.value)
      : null,
)
