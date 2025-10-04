import type { TextFieldClientProps } from '../../../admin/types.js'
import type { FieldAdmin, RowField } from '../../../fields/config/types.js'

import { generateSlug } from './generateSlug.js'

type SlugFieldArgs = {
  /**
   * Override for the `generateSlug` checkbox field name.
   * @default 'generateSlug'
   */
  checkboxName?: string
  /**
   * The name of the field to generate the slug from, when applicable.
   * @default 'title'
   */
  fieldToUse?: string
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
  position?: FieldAdmin['position']
  /**
   * Whether or not the `slug` field is required.
   */
  required?: boolean
}

type SlugField = (args?: SlugFieldArgs) => RowField

export type SlugFieldClientProps = {} & Pick<SlugFieldArgs, 'fieldToUse'>

export type SlugFieldProps = SlugFieldClientProps & TextFieldClientProps

/**
 * The `slug` field is auto-generated based on another field.
 * For example, it will take a "title" field and transform its value from "My Title" → "my-title".
 *
 * The slug should generated through:
 * 1. The `create` operation, unless the user has modified the slug manually
 * 2. The `update` operation, if:
 *   a. Autosave is _not_ enabled and there is no slug
 *   b. Autosave _is_ enabled, the doc is unpublished, and the user has not modified the slug themselves
 *
 * The slug should stabilize after all above criteria have been met, because the URL is typically derived from the slug.
 * This is to protect modifying potentially live URLs, breaking links, etc. without explicit intent.
 *
 * @experimental This field is experimental and may change or be removed in the future. Use at your own discretion.
 */
export const slugField: SlugField = ({
  name: fieldName = 'slug',
  checkboxName = 'generateSlug',
  fieldToUse = 'title',
  overrides,
  position,
  required,
} = {}) => {
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
          disableBulkEdit: true,
          disableGroupBy: true,
          disableListColumn: true,
          disableListFilter: true,
          hidden: true,
        },
        defaultValue: true,
        hooks: {
          beforeChange: [generateSlug(fieldToUse)],
        },
      },
      {
        name: fieldName,
        type: 'text',
        admin: {
          components: {
            Field: {
              clientProps: {
                fieldToUse,
              } satisfies SlugFieldClientProps,
              path: '@payloadcms/ui#SlugField',
            },
          },
          width: '100%',
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
