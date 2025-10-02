import type { FieldHook } from 'payload'
import { countVersions } from './countVersions'
import { toKebabCase } from 'payload/shared'

/**
 * This is a `BeforeChange` field hook for the "slug" field.
 * See `slugField` for more details.
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
          data.slug = toKebabCase(data?.[fallback])
        }

        return Boolean(!data?.slug)
      } else {
        // If we're publishing, we can avoid querying as we can safely assume we've exceeded the version threshold (2)
        const isPublishing = data?._status === 'published'

        // Ensure the user can take over the generated slug themselves without it ever being overridden back
        const hasChangedSlugManually = data?.slug !== originalDoc?.slug

        if (!hasChangedSlugManually) {
          if (data) {
            data.slug = toKebabCase(data?.[fallback])
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
