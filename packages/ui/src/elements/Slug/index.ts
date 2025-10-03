import type { CheckboxField, RowField, TextField } from 'payload'

import { generateSlug } from './generateSlug.js'

type Overrides = {
  generateSlugOverrides?: Partial<CheckboxField>
  slugOverrides?: Partial<TextField>
}

type SlugField = (fieldToUse?: string, overrides?: Overrides) => RowField

/**
 * The `slug` field is auto-generated based on another field.
 * For example, it will take a "title" field and transform its value from "My Title" → "my-title".
 *
 * The slug should generated through:
 * 1. the `create` operation, unless the user has modified the slug manually
 * 2. the `update` operation, if:
 *   a. autosave is _not_ enabled and there is no slug
 *   b. autosave _is_ enabled, the doc is unpublished, and the user has not modified the slug themselves
 *
 * The slug should stabilize after all above criteria have been met, because the URL is typically derived from the slug.
 * This is to protect modifying potentially live URLs, breaking links, etc. without explicit intent.
 */
export const slugField: SlugField = (fieldToUse = 'title', overrides = {}) => {
  const { generateSlugOverrides, slugOverrides } = overrides

  return {
    type: 'row',
    fields: [
      {
        name: 'generateSlug',
        type: 'checkbox',
        admin: {
          description:
            'When enabled, the slug will auto-generate from the title field on save and autosave.',
          hidden: true,
          position: 'sidebar',
        },
        defaultValue: true,
        hooks: {
          beforeChange: [generateSlug(fieldToUse)],
        },
        label: 'Auto-generate slug',
        ...(generateSlugOverrides || {}),
      },
      {
        name: 'slug',
        type: 'text',
        index: true,
        label: 'Slug',
        ...((slugOverrides || {}) as any),
        admin: {
          position: 'sidebar',
          ...(slugOverrides?.admin || {}),
          components: {
            Field: {
              clientProps: {
                fieldToUse,
              },
              path: '@/fields/slug/SlugComponent#SlugComponent',
            },
          },
        },
      },
    ],
  }
}
