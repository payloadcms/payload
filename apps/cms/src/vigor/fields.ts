import type { Field, FieldHook, TextFieldSingleValidation } from 'payload'

import { slugify, text } from 'payload/shared'

/** "Emerald Halo Ring" → "emerald-halo-ring": derived from `from` while empty, normalized when typed */
const fillSlug =
  ({ from }: { from: string }): FieldHook =>
  ({ data, value }) => {
    const slug = typeof value === 'string' && value.trim() ? value : data?.[from]
    return typeof slug === 'string' ? slugify(slug) || undefined : value
  }

/** The item's address on the website, e.g. /products/<slug>. The same in every language. */
export const slugField = ({ from }: { from: string }): Field => ({
  name: 'slug',
  type: 'text',
  admin: {
    description: `Used in the address on the website, the same in every language. Filled in from the ${from} when left empty; don't change it once the page is live.`,
    position: 'sidebar',
  },
  hooks: {
    beforeDuplicate: [({ value }) => (value ? `${value}-copy` : value)],
    beforeValidate: [fillSlug({ from })],
  },
  // Filled in before validation, so it's never empty when saved
  required: true,
  unique: true,
})

export const sortOrderField: Field = {
  name: 'sortOrder',
  type: 'number',
  admin: {
    description: 'Lower numbers are shown first.',
    position: 'sidebar',
  },
  defaultValue: 0,
}

/** Plain text that the website splits into paragraphs at blank lines */
export const bodyField: Field = {
  name: 'body',
  type: 'textarea',
  admin: {
    description: 'Separate paragraphs with a blank line.',
    rows: 8,
  },
  localized: true,
}

export const imageField = ({ description }: { description?: string } = {}): Field => ({
  name: 'image',
  type: 'upload',
  admin: description ? { description } : undefined,
  relationTo: 'media',
})

/** A calendar day without a time, e.g. a news date */
export const dayField = ({ sidebar = false }: { sidebar?: boolean } = {}): Field => ({
  name: 'date',
  type: 'date',
  admin: {
    date: {
      displayFormat: 'd MMM yyyy',
      pickerAppearance: 'dayOnly',
    },
    position: sidebar ? 'sidebar' : undefined,
  },
  required: true,
})

/** A page on the website, e.g. /products. The website adds the visitor's language to it. */
export const linkField = ({ name, label }: { label: string; name: string }): Field => ({
  name,
  type: 'text',
  admin: {
    description: 'A page on the website, e.g. /products',
  },
  label,
  required: true,
  validate: ((value, options) =>
    !value || /^\/(?!\/)\S*$/.test(value)
      ? text(value, options)
      : 'Use a path that starts with /, e.g. /products') satisfies TextFieldSingleValidation,
})
