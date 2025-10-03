import type { RowField } from 'payload'

import { generateSlug } from './generateSlug.js'

type SlugField = (args?: {
  /**
   * Override for the `generateSlug` checkbox field name.
   * @default 'generateSlug'
   */
  checkboxName?: string
  /**
   * The name of the field to generate the slug from, when applicable.
   * @default 'title'
   */
  fallback?: string
  /**
   * Override for the `slug` field name.
   * @default 'slug'
   */
  name?: string
  /**
   * A function used to override te fields at a granular level.
   * Passes the row field to you to manipulate beyond the exposed options.
   */
  overrides?: (field: RowField) => RowField
  position?: RowField['admin']['position']
  /**
   * Whether or not the `slug` field is required.
   */
  required?: boolean
}) => RowField

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
 *
 * @experimental This property is experimental and may change in the future. Use at your own discretion.
 */
export const slugField: SlugField = ({
  name: fieldName = 'slug',
  checkboxName = 'generateSlug',
  fallback = 'title',
  overrides,
  position = 'sidebar',
  required,
}) => {
  const baseField: RowField = {
    type: 'row',
    admin: {
      position,
    },
    fields: [
      {
        name: checkboxName,
        type: 'checkbox',
        admin: {
          description:
            'When enabled, the slug will auto-generate from the title field on save and autosave.',
          hidden: true,
        },
        defaultValue: true,
        hooks: {
          beforeChange: [generateSlug(fallback)],
        },
      },
      {
        name: fieldName,
        type: 'text',
        admin: {
          components: {
            Field: {
              clientProps: {
                fallback,
              },
              path: '@/fields/slug/SlugComponent#SlugComponent',
            },
          },
        },
        index: true,
        required,
      },
    ],
  }

  if (typeof overrides === 'function') {
    return overrides(baseField)
  }

  return baseField
}
