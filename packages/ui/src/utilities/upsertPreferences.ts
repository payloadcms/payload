import type { PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite'

import { removeUndefined } from './removeUndefined.js'

/**
 * Will update the given preferences by key, creating a new record if it doesn't already exist, or merging existing preferences with the new value.
 * This is not possible to do with the existing `db.upsert` operation because it stores on the `value` key and does not perform a deep merge beyond the first level.
 * I.e. if you have a preferences record with a `value` key, `db.upsert` will overwrite the existing value. In the future if this supported we should use that instead.
 * @param req - The PayloadRequest object
 * @param key - The key of the preferences to update
 * @param value - The new value to merge with the existing preferences
 */
export const upsertPreferences = async <T extends Record<string, any>>({
  key,
  req,
  value: incomingValue,
}: {
  key: string
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
              equals: key,
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

  if (!preferencesResult.id) {
    await req.payload.create({
      collection: 'payload-preferences',
      data: {
        key,
        user: {
          collection: req.user.collection,
          value: req.user.id,
        },
        value: incomingValue,
      },
      depth: 0,
      req,
    })
  } else {
    const mergedPrefs = {
      ...(preferencesResult?.value || {}), // Shallow merge existing prefs to acquire any missing keys from incoming value
      ...removeUndefined(incomingValue || {}),
    }

    if (!dequal(mergedPrefs, preferencesResult.value)) {
      newPrefs = await req.payload
        .update({
          id: preferencesResult.id,
          collection: 'payload-preferences',
          data: {
            key,
            user: {
              collection: req.user.collection,
              value: req.user.id,
            },
            value: mergedPrefs,
          },
          depth: 0,
          req,
        })
        ?.then((res) => res.value)
    }
  }

  return newPrefs
}
