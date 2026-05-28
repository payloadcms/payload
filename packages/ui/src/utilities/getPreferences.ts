import type { DefaultDocumentIDType, Payload } from 'payload'

import { cache } from 'react'

/**
 * Read a `payload-preferences` document for a given user, cached per-request
 * via React's `cache` helper. Framework-agnostic — relies on standard React
 * 19 `cache` semantics available in any RSC runtime.
 */
export const getPreferences = cache(
  async <T>(
    key: string,
    payload: Payload,
    userID: DefaultDocumentIDType,
    userSlug: string,
  ): Promise<{ id: DefaultDocumentIDType; value: T }> => {
    const result = (await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        pagination: false,
        where: {
          and: [
            {
              key: {
                equals: key,
              },
            },
            {
              'user.relationTo': {
                equals: userSlug,
              },
            },
            {
              'user.value': {
                equals: userID,
              },
            },
          ],
        },
      })
      .then((res) => res.docs?.[0])) as { id: DefaultDocumentIDType; value: T }

    return result
  },
)
