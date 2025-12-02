import type { FieldHook } from '../../config/types.js'
import type { SlugFieldArgs } from './index.js'

import { slugify } from '../../../utilities/slugify.js'
import { countVersions } from './countVersions.js'

type HookArgs = {
  slugFieldName: Required<SlugFieldArgs>['name']
  useAsSlug: Required<SlugFieldArgs>['useAsSlug']
} & Parameters<FieldHook>[0]

/**
 * This is a `BeforeChange` field hook used to auto-generate the `slug` field.
 * See `slugField` for more details.
 */
export const generateSlug = async ({
  collection,
  global,
  operation,
  originalDoc,
  req,
  siblingData,
  slugFieldName,
  useAsSlug,
  value: isChecked,
}: HookArgs) => {
  // Throughout this function, we can safely assume the `slug` field is the direct sibling of this checkbox
  // This allows us for faster lookups via `siblingData`, i.e. avoid using `getDataByPath`
  const originalValue = siblingData?.[slugFieldName]

  // Ensure user-defined slugs are not overwritten during create
  // Use a generic falsy check here to include empty strings
  if (operation === 'create') {
    if (siblingData) {
      siblingData[slugFieldName] = slugify(siblingData?.[slugFieldName] || siblingData?.[useAsSlug])
    }

    return Boolean(!siblingData?.[slugFieldName])
  }

  if (operation === 'update') {
    // Early return to avoid additional processing
    if (!isChecked) {
      return false
    }

    const autosaveEnabled = Boolean(
      (typeof collection?.versions?.drafts === 'object' && collection?.versions?.drafts.autosave) ||
        (typeof global?.versions?.drafts === 'object' && global?.versions?.drafts.autosave),
    )

    if (!autosaveEnabled) {
      // We can generate the slug at this point
      if (siblingData) {
        siblingData[slugFieldName] = slugify(siblingData?.[useAsSlug])
      }

      return Boolean(!siblingData?.[slugFieldName])
    } else {
      // If we're publishing, we can avoid querying as we can safely assume we've exceeded the version threshold (2)
      const isPublishing = siblingData?._status === 'published'

      // Ensure the user can take over the generated slug themselves without it ever being overridden back
      const userOverride = siblingData?.[slugFieldName] !== originalValue

      if (!userOverride) {
        if (siblingData) {
          // If the fallback is an empty string, we want the slug to return to `null`
          // This will ensure that live preview conditions continue to run as expected
          siblingData[slugFieldName] = siblingData?.[useAsSlug]
            ? slugify(siblingData[useAsSlug])
            : null
        }
      }

      if (isPublishing || userOverride) {
        return false
      }

      // Important: ensure `countVersions` is not called unnecessarily often
      // That is why this is buried beneath all these conditions
      const versionCount = await countVersions({
        collectionSlug: collection?.slug,
        globalSlug: global?.slug,
        parentID: originalDoc?.id,
        req,
      })

      if (versionCount <= 2) {
        return true
      } else {
        return false
      }
    }
  }
}
