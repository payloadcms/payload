import type { DefaultDocumentIDType, Payload } from 'payload'

/**
 * Fetches a user's preference by key. Unlike the Next.js version, this does not
 * use `React.cache()` since TanStack Start has no RSC request-level memoization.
 */
export async function getPreferences<T>(
  key: string,
  payload: Payload,
  userID: DefaultDocumentIDType,
  userSlug: string,
): Promise<{ id: DefaultDocumentIDType; value: T }> {
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
}
