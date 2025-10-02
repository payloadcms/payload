import type { CheckboxField, TextField } from 'payload'

import { generateSlug } from './generateSlug'

type Overrides = {
  slugOverrides?: Partial<TextField>
  generateSlugOverrides?: Partial<CheckboxField>
}

type Slug = (fieldToUse?: string, overrides?: Overrides) => [TextField, CheckboxField]

// @ts-expect-error - ts mismatch Partial<TextField> with TextField
export const slugField: Slug = (fieldToUse = 'title', overrides = {}) => {
  const { slugOverrides, generateSlugOverrides } = overrides

  return [
    {
      name: 'generateSlug',
      type: 'checkbox',
      label: 'Auto-generate slug',
      defaultValue: true,
      admin: {
        description:
          'When enabled, the slug will auto-generate from the title field on save and autosave.',
        position: 'sidebar',
        hidden: true,
      },
      hooks: {
        beforeChange: [generateSlug(fieldToUse)],
      },
      ...(generateSlugOverrides || {}),
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      label: 'Slug',
      ...(slugOverrides || {}),
      admin: {
        position: 'sidebar',
        ...(slugOverrides?.admin || {}),
        components: {
          Field: {
            path: '@/fields/slug/SlugComponent#SlugComponent',
            clientProps: {
              fieldToUse,
            },
          },
        },
      },
    },
  ]
}
