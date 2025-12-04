import type { PayloadRequest } from '../../../types/index.js'
import type { FieldHook } from '../../config/types.js'
import type { SlugFieldArgs, Slugify } from './index.js'

import { hasAutosaveEnabled } from '../../../utilities/getVersionsConfig.js'
import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { countVersions } from './countVersions.js'

type HookArgs = {
  slugFieldName: NonNullable<SlugFieldArgs['name']>
} & Pick<SlugFieldArgs, 'slugify'> &
  Required<Pick<SlugFieldArgs, 'useAsSlug'>>

const slugify = ({
  customSlugify,
  data,
  req,
  valueToSlugify,
}: {
  customSlugify?: Slugify
  data: Record<string, unknown>
  req: PayloadRequest
  valueToSlugify?: string
}) => {
  if (customSlugify) {
    return customSlugify({ data, req, valueToSlugify })
  }

  return defaultSlugify(valueToSlugify)
}

/**
 * This is a `BeforeChange` field hook used to auto-generate the `slug` field.
 * See `slugField` for more details.
 */
export const generateSlug =
  ({ slugFieldName, slugify: customSlugify, useAsSlug }: HookArgs): FieldHook =>
  async ({ collection, data, global, operation, originalDoc, req, value: isChecked }) => {
    if (operation === 'create') {
      if (data) {
        data[slugFieldName] = slugify({
          customSlugify,
          data,
          req,
          // Ensure user-defined slugs are not overwritten during create
          // Use a generic falsy check here to include empty strings
          valueToSlugify: data?.[slugFieldName] || data?.[useAsSlug],
        })
      }

      return Boolean(!data?.[slugFieldName])
    }

    if (operation === 'update') {
      // Early return to avoid additional processing
      if (!isChecked) {
        return false
      }

      if (!hasAutosaveEnabled(collection || global!)) {
        // We can generate the slug at this point
        if (data) {
          data[slugFieldName] = slugify({
            customSlugify,
            data,
            req,
            valueToSlugify: data?.[useAsSlug],
          })
        }

        return Boolean(!data?.[slugFieldName])
      } else {
        // If we're publishing, we can avoid querying as we can safely assume we've exceeded the version threshold (2)
        const isPublishing = data?._status === 'published'

        // Ensure the user can take over the generated slug themselves without it ever being overridden back
        const userOverride = data?.[slugFieldName] !== originalDoc?.[slugFieldName]

        if (!userOverride) {
          if (data) {
            // If the fallback is an empty string, we want the slug to return to `null`
            // This will ensure that live preview conditions continue to run as expected
            data[slugFieldName] = data?.[useAsSlug]
              ? slugify({
                  customSlugify,
                  data,
                  req,
                  valueToSlugify: data?.[useAsSlug],
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
