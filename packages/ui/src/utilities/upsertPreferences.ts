import type { DefaultDocumentIDType, PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite'

import { removeUndefined } from './removeUndefined.js'

const getPreferences = async <T>({
  key,
  req,
}: {
  key: string
  req: PayloadRequest
}): Promise<{ id: DefaultDocumentIDType; value: T }> => {
  const result = (await req.payload
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
    .then((res) => res.docs?.[0])) as { id: DefaultDocumentIDType; value: T }

  return result
}

/**
 * Will update the given preferences by key, creating a new record if it doesn't already exist, or merging existing preferences with the new value.
 * This is not possible to do with the existing `db.upsert` operation because it stores on the `value` key and does not perform a deep merge beyond the first level.
 * I.e. if you have a preferences record with a `value` key, `db.upsert` will overwrite the existing value. In the future if this supported we should use that instead.
 * @param req - The PayloadRequest object
 * @param key - The key of the preferences to update
 * @param value - The new value to merge with the existing preferences
 */
export const upsertPreferences = async <T extends Record<string, unknown> | string>({
  key,
  req,
  value: incomingValue,
}: {
  key: string
  req: PayloadRequest
  value: T
}): Promise<T> => {
  const existingPrefs = await getPreferences<T>({
    key,
    req,
  })

  let newPrefs = existingPrefs?.value

  if (!existingPrefs?.id) {
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
    // Strings are valid JSON, i.e. `locale` saved as a string to the locale preferences
    const mergedPrefs =
      typeof incomingValue === 'object'
        ? {
            ...(typeof existingPrefs.value === 'object' ? existingPrefs?.value : {}), // Shallow merge existing prefs to acquire any missing keys from incoming value
            ...removeUndefined(incomingValue || {}),
          }
        : incomingValue

    if (!dequal(mergedPrefs, existingPrefs.value)) {
      newPrefs = await req.payload
        .update({
          id: existingPrefs.id,
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
