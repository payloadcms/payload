import { dequal } from 'dequal/lite';
import { cache } from 'react';
import { removeUndefined } from './removeUndefined.js';
const defaultMerge = (existingValue, incomingValue) => ({
  ...(typeof existingValue === 'object' ? existingValue : {}),
  ...removeUndefined(incomingValue || {})
});
export const getPreferences = cache(async (key, payload, userID, userSlug) => {
  const result = await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      and: [{
        key: {
          equals: key
        }
      }, {
        'user.relationTo': {
          equals: userSlug
        }
      }, {
        'user.value': {
          equals: userID
        }
      }]
    }
  }).then(res => res.docs?.[0]);
  return result;
});
/**
 * Will update the given preferences by key, creating a new record if it doesn't already exist, or merging existing preferences with the new value.
 * This is not possible to do with the existing `db.upsert` operation because it stores on the `value` key and does not perform a deep merge beyond the first level.
 * I.e. if you have a preferences record with a `value` key, `db.upsert` will overwrite the existing value. In the future if this supported we should use that instead.
 * @param req - The PayloadRequest object
 * @param key - The key of the preferences to update
 * @param value - The new value to merge with the existing preferences
 */
export const upsertPreferences = async ({
  customMerge,
  key,
  req,
  value: incomingValue
}) => {
  const existingPrefs = req.user ? await getPreferences(key, req.payload, req.user.id, req.user.collection) : {};
  let newPrefs = existingPrefs?.value;
  if (!existingPrefs?.id) {
    await req.payload.create({
      collection: 'payload-preferences',
      data: {
        key,
        user: {
          collection: req.user.collection,
          value: req.user.id
        },
        value: incomingValue
      },
      depth: 0,
      disableTransaction: true,
      user: req.user
    });
  } else {
    let mergedPrefs;
    if (typeof customMerge === 'function') {
      mergedPrefs = customMerge(existingPrefs.value, incomingValue, defaultMerge);
    } else {
      // Strings are valid JSON, i.e. `locale` saved as a string to the locale preferences
      mergedPrefs = typeof incomingValue === 'object' ? defaultMerge(existingPrefs.value, incomingValue) : incomingValue;
    }
    if (!dequal(mergedPrefs, existingPrefs.value)) {
      newPrefs = await req.payload.update({
        id: existingPrefs.id,
        collection: 'payload-preferences',
        data: {
          key,
          user: {
            collection: req.user.collection,
            value: req.user.id
          },
          value: mergedPrefs
        },
        depth: 0,
        disableTransaction: true,
        user: req.user
      })?.then(res => res.value);
    }
  }
  return newPrefs;
};
//# sourceMappingURL=upsertPreferences.js.map