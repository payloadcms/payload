import type { PayloadRequest } from '../../../types/index.js'
import type { FieldHook } from '../../config/types.js'
import type { SlugFieldArgs, Slugify } from './index.js'

import { getDataByPath } from '../../../utilities/getDataByPath.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { countVersions } from './countVersions.js'

type HookArgs = {} & Pick<SlugFieldArgs, 'slugify'> &
  Required<Pick<SlugFieldArgs, 'fieldToUse' | 'name'>>

const slugify = ({
  customSlugify,
  data,
  fieldToUse,
  req,
}: {
  customSlugify?: Slugify
  data: Record<string, unknown>
  fieldToUse: string
  req: PayloadRequest
}) => {
  const value = getDataByPath<string>({ data, path: fieldToUse })

  if (customSlugify) {
    return customSlugify({ data, req, value })
  }

  return defaultSlugify(value)
}

/**
 * This is a `BeforeChange` field hook used to auto-generate the `slug` field.
 * See `slugField` for more details.
 */
export const generateSlug =
  ({ name, fieldToUse, slugify: customSlugify }: HookArgs): FieldHook =>
  async (args) => {
    const { collection, data, global, operation, originalDoc, req, value: isChecked } = args

    // Ensure user-defined slugs are not overwritten during create
    // Use a generic falsy check here to include empty strings
    if (operation === 'create') {
      if (data) {
        data[name] = slugify({ customSlugify, data, fieldToUse, req })
      }

      return Boolean(!data?.[name])
    }

    if (operation === 'update') {
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
        // We can generate the slug at this point
        if (data) {
          data[name] = slugify({ customSlugify, data, fieldToUse, req })
        }

        return Boolean(!data?.[name])
      } else {
        // If we're publishing, we can avoid querying as we can safely assume we've exceeded the version threshold (2)
        const isPublishing = data?._status === 'published'

        // Ensure the user can take over the generated slug themselves without it ever being overridden back
        const userOverride = data?.[name] !== originalDoc?.[name]

        if (!userOverride) {
          if (data) {
            // If the fallback is an empty string, we want the slug to return to `null`
            // This will ensure that live preview conditions continue to run as expected
            data[name] = data?.[fieldToUse]
              ? slugify({
                  customSlugify,
                  data,
                  fieldToUse,
                  req,
                })
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
          req: args.req,
        })

        if (versionCount <= 2) {
          return true
        } else {
          return false
        }
      }
    }
  }
