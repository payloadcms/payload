import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldHook } from '../../config/types.js'
import type { Slugify } from './types.js'

import { slugify as defaultSlugify } from '../../../utilities/slugify.js'
import { getSlugFallbackValue } from './getSlugFallbackValue.js'

type Args = {
  name: string
  slugify?: Slugify
}

/**
 * `beforeDuplicate` hook for the native `slug` field.
 *
 * A copy can't reuse the original's unique slug, so it takes a fresh `<singular>-<N>` fallback rather
 * than a value derived from the copied source (which would collide with, or read as if it pointed
 * at, the original). See {@link getSlugFallbackValue}.
 */
export const generateSlugBeforeDuplicate =
  ({ name, slugify: customSlugify }: Args): FieldHook =>
  async ({ collection, data, req }) => {
    if (!collection) {
      return undefined
    }

    const slugify = (valueToSlugify: unknown) =>
      customSlugify
        ? customSlugify({ data: (data ?? {}) as TypeWithID, req, valueToSlugify })
        : defaultSlugify(valueToSlugify as string)

    return getSlugFallbackValue({ collection, field: name, req, slugify })
  }
