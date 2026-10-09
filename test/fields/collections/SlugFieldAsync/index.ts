import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { asyncSlugify, slugFieldAsyncAutosaveSlug, slugFieldAsyncSlug } from './shared.js'

/**
 * Exercises the `create` and `update` (autosave disabled) branches of the slug field's
 * `beforeChange` hook with an async `slugify`.
 */
export const SlugFieldAsync: CollectionConfig = {
  slug: slugFieldAsyncSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    slugField({
      disableUnique: true,
      required: false,
      slugify: asyncSlugify,
    }),
  ],
}

/**
 * Exercises the `update` branch taken when autosave is enabled, which assigns the slug through
 * a separate call site.
 */
export const SlugFieldAsyncAutosave: CollectionConfig = {
  slug: slugFieldAsyncAutosaveSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    slugField({
      disableUnique: true,
      required: false,
      slugify: asyncSlugify,
    }),
  ],
  versions: { drafts: { autosave: true } },
}
