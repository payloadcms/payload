import type { FieldHook } from 'payload'
import { countVersions } from './countVersions'
import { slugify } from './slugify'

/**
 * This is a `BeforeChange` field hook that generates the `slug` field based on another field.
 * For example, it will take a "title" field and transform its value from "My Title" → "my-title".
 *
 * This should only run on:
 * 1. the `create` operation unless the user has provided on themselves
 * 2. the `update` operation if:
 *   a. autosave is _not_ enabled and there is no slug
 *   b. autosave _is_ enabled and there are only 2 versions: the initial create and the autosaved draft
 *     i. UNLESS the user has modified the slug directly, in this case we want them to take it over without it being overridden
 */
export const generateSlug =
  (fallback: string): FieldHook =>
  async (args) => {
    const { operation, value: isChecked, collection, global, data, originalDoc } = args

    // Ensure user-defined slugs are not overwritten during create
    // Use a generic falsy check here so that empty strings are still generated
    if (operation === 'create') {
      return Boolean(!data?.slug)
    }

    if (operation === 'update') {
      console.log({ data, originalDoc })
      // Early return to avoid additional processing
      if (!isChecked) {
        return false
      }

      const autosaveEnabled = Boolean(
        (typeof collection?.versions?.drafts === 'object' &&
          collection?.versions?.drafts.autosave) ||
          (typeof global?.versions?.drafts === 'object' && global?.versions?.drafts.autosave),
      )

      if (!autosaveEnabled) {
        // Generate the slug here
        if (data) {
          data.slug = slugify(data?.[fallback])
        }

        return Boolean(!data?.slug)
      } else {
        // If we're publishing, we can avoid querying as we can safely assume we've exceeded the version threshold (2)
        const isPublishing = data?._status === 'published'

        // Ensure the user can take over the generated slug themselves without it ever being overridden back
        const hasChangedSlugManually = data?.slug !== originalDoc?.slug

        if (!hasChangedSlugManually) {
          if (data) {
            data.slug = slugify(data?.[fallback])
          }
        }

        if (isPublishing || hasChangedSlugManually) {
          return false
        }

        // Important: ensure `countVersions` is not called unnecessarily often
        // That is why this is buried beneath all these conditions
        const versionCount = await countVersions(args)

        if (versionCount <= 2) {
          return true
        } else {
          return false
        }
      }
    }
  }
