import type { DocumentPreferences, Payload, TypedUser } from 'payload'

import { sanitizeID } from '@payloadcms/ui/shared'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  payload: Payload
  user: TypedUser
}

export const getDocPreferences = async ({
  id,
  collectionSlug,
  globalSlug,
  payload,
  user,
}: Args): Promise<DocumentPreferences> => {
  let preferencesKey

  if (collectionSlug && id) {
    preferencesKey = `collection-${collectionSlug}-${id}`
  }

  if (globalSlug) {
    preferencesKey = `global-${globalSlug}`
  }

  if (preferencesKey) {
    const preferencesResult = (await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            key: {
              equals: preferencesKey,
            },
          },
          {
            'user.relationTo': {
              equals: user.collection,
            },
          },
          {
            'user.value': {
              equals: sanitizeID(user.id),
            },
          },
        ],
      },
    })) as unknown as { docs: { value: DocumentPreferences }[] }

    if (preferencesResult?.docs?.[0]?.value) {
      return preferencesResult.docs[0].value
    }
  }

  return { fields: {} }
}
