import type { PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite'

/**
 * Will update the given preferences by key, merging existing preferences if necessary.
 * This is something that is not possible to do with the `db.upsert` operation.
 * @param payload - The Payload instance
 * @param preferencesKey - The key of the preferences to update
 */
export const updatePreferences = async <T extends Record<string, any>>({
  preferencesKey,
  req,
  value,
}: {
  preferencesKey: string
  req: PayloadRequest
  value: Record<string, any>
}): Promise<T> => {
  const preferencesResult = await req.payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            key: {
              equals: preferencesKey,
            },
          },
          {
            'user.relationTo': {
              equals: req.user.collection,
            },
          },
          {
            'user.value': {
              equals: req.user.id,
            },
          },
        ],
      },
    })
    .then((res) => res.docs[0] ?? { id: null, value: {} })

  let newPrefs = preferencesResult.value

  if (
    !preferencesResult.id ||
    !dequal(
      {
        ...(value || {}),
        ...(preferencesResult?.value || {}), // Shallow merge existing prefs to acquire any missing keys from incoming value
      },
      preferencesResult.value,
    )
  ) {
    const preferencesArgs = {
      collection: 'payload-preferences',
      data: {
        key: preferencesKey,
        user: {
          collection: req.user.collection,
          value: req.user.id,
        },
        value: {
          ...(preferencesResult?.value || {}),
          ...value,
        },
      },
      depth: 0,
      req,
    }

    if (preferencesResult.id) {
      newPrefs = await req.payload
        .update({
          ...preferencesArgs,
          id: preferencesResult.id,
        })
        ?.then((res) => res.value)
    } else {
      newPrefs = await req.payload.create(preferencesArgs)?.then((res) => res.value)
    }
  }

  return newPrefs
}
