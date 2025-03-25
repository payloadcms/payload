import type { DefaultDocumentIDType, Payload, PayloadRequest } from 'payload'

import { dequal } from 'dequal/lite'
import { cache } from 'react'

import { removeUndefined } from './removeUndefined.js'

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

/**
 * Will update the given preferences by key, creating a new record if it doesn't already exist, or merging existing preferences with the new value.
 * This is not possible to do with the existing `db.upsert` operation because it stores on the `value` key and does not perform a deep merge beyond the first level.
 * I.e. if you have a preferences record with a `value` key, `db.upsert` will overwrite the existing value. In the future if this supported we should use that instead.
 * @param req - The PayloadRequest object
 * @param key - The key of the preferences to update
 * @param value - The new value to merge with the existing preferences
 */
export const upsertPreferences = async <T extends Record<string, unknown> | string>({
  customMerge,
  key,
  req,
  value: incomingValue,
}: {
  key: string
  req: PayloadRequest
} & (
  | {
      customMerge: (existingValue: T) => T
      value?: never
    }
  | {
      customMerge?: never
      value: T
    }
)): Promise<T> => {
  const existingPrefs: { id?: DefaultDocumentIDType; value?: T } = req.user
    ? await getPreferences<T>(key, req.payload, req.user.id, req.user.collection)
    : {}

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
      disableTransaction: true,
      user: req.user,
    })
  } else {
    let mergedPrefs: T

    if (typeof customMerge === 'function') {
      mergedPrefs = customMerge(existingPrefs.value)
    } else {
      // Strings are valid JSON, i.e. `locale` saved as a string to the locale preferences
      mergedPrefs =
        typeof incomingValue === 'object'
          ? ({
              ...(typeof existingPrefs.value === 'object' ? existingPrefs?.value : {}), // Shallow merge existing prefs to acquire any missing keys from incoming value
              ...removeUndefined(incomingValue || {}),
            } as T)
          : incomingValue
    }

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
          disableTransaction: true,
          user: req.user,
        })
        ?.then((res) => res.value)
    }
  }

  return newPrefs
}
