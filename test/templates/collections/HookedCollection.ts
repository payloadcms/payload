import type { CollectionConfig } from 'payload'

import { hookedCollectionSlug } from '../slugs.js'

/**
 * Collection wired up to exercise the `beforeSaveAsTemplate` and `beforeApplyTemplate`
 * field hooks. The `secret` field is scrubbed when saved as a template; the `slug`
 * field is regenerated when applied.
 */
export const HookedCollection: CollectionConfig = {
  slug: hookedCollectionSlug,
  templates: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'secret',
      type: 'text',
      hooks: {
        // @ts-expect-error — added in Phase 3
        beforeSaveAsTemplate: [() => undefined],
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: {
        // @ts-expect-error — added in Phase 3
        beforeApplyTemplate: [() => `applied-${Math.random().toString(36).slice(2, 8)}`],
      },
    },
  ],
}
