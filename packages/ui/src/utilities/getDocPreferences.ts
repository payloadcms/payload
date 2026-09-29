import type { DocumentPreferences, Payload, User } from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  payload: Payload
  user: User
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
      overrideAccess: true,
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
              equals: user.id,
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
