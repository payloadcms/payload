import type { TextFieldClientProps } from '../../../admin/types.js'
import type { TypeWithID } from '../../../collections/config/types.js'
import type { FieldAdmin, RowField, TextField } from '../../../fields/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { generateSlug } from './generateSlug.js'

export type Slugify<T extends TypeWithID = any> = (args: {
  data: T
  req: PayloadRequest
  valueToSlugify?: any
}) => Promise<string | undefined> | string | undefined

export type SlugFieldArgs = {
  /**
   * Override for the `generateSlug` checkbox field name.
   * @default 'generateSlug'
   */
  checkboxName?: string
  /**
   * @deprecated use `useAsSlug` instead.
   */
  fieldToUse?: string
  /**
   * Enable localization for the slug field.
   */
  localized?: TextField['localized']
  /**
   * Override for the `slug` field name.
   * @default 'slug'
   */
  name?: string
  /**
   * A function used to override the slug field(s) at a granular level.
   * Passes the row field to you to manipulate beyond the exposed options.
   * @example
   * ```ts
   * slugField({
   *   overrides: (field) => {
   *     field.fields[1].label = 'Custom Slug Label'
   *     return field
   *   }
   * })
   * ```
   */
  overrides?: (field: RowField) => RowField
  position?: FieldAdmin['position']
  /**
   * Whether or not the `slug` field is required.
   * @default true
   */
  required?: TextField['required']
  /**
   * Provide your own slugify function to override the default.
   */
  slugify?: Slugify
  /**
   * The name of the top-level field to generate the slug from, when applicable.
   * @default 'title'
   */
  useAsSlug?: string
}

export type SlugField = (args?: SlugFieldArgs) => RowField

export type SlugFieldClientPropsOnly = Pick<SlugFieldArgs, 'useAsSlug'>
/**
 * These are the props that the `SlugField` client component accepts.
 * The `SlugField` server component is responsible for passing down the `slugify` function.
 */
export type SlugFieldClientProps = SlugFieldClientPropsOnly & TextFieldClientProps

/**
 * A slug is a unique, indexed, URL-friendly string that identifies a particular document, often used to construct the URL of a webpage.
 * The `slug` field auto-generates its value based on another field, e.g. "My Title" → "my-title".
 *
 * The slug should continue to be generated through:
 * 1. The `create` operation, unless the user has modified the slug manually
 * 2. The `update` operation, if:
 *   a. Autosave is _not_ enabled and there is no slug
 *   b. Autosave _is_ enabled, the doc is unpublished, and the user has not modified the slug manually
 *
 * The slug should stabilize after all above criteria have been met, because the URL is typically derived from the slug.
 * This is to protect modifying potentially live URLs, breaking links, etc. without explicit intent.
 *
 * @experimental This field is experimental and may change or be removed in the future. Use at your own risk.
 */
export const slugField: SlugField = (options = {}) => {
  const {
    name: slugFieldName = 'slug',
    checkboxName = 'generateSlug',
    fieldToUse,
    localized,
    overrides,
    position: providedPosition,
    required = true,
    slugify,
    useAsSlug: useAsSlugFromArgs = 'title',
  } = options

  const useAsSlug = fieldToUse || useAsSlugFromArgs
  const position = 'position' in options ? providedPosition : 'sidebar'

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
          beforeChange: [generateSlug({ slugFieldName, slugify, useAsSlug })],
        },
        localized,
      },
      {
        name: slugFieldName,
        type: 'text',
        admin: {
          components: {
            Field: {
              clientProps: {
                useAsSlug,
              } satisfies SlugFieldClientPropsOnly,
              path: '@payloadcms/next/client#SlugField',
            },
          },
          width: '100%',
        },
        custom: {
          /**
           * This is needed so we can access it from the `slugifyHandler` server function.
           */
          slugify,
        },
        index: true,
        localized,
        required,
        unique: true,
      },
    ],
  }

  if (typeof overrides === 'function') {
    return overrides(baseField)
  }

  return baseField
}
