import type { Field } from 'payload'

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  admin: {
    description: 'Stable identifier; generated from title or name when empty.',
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ siblingData, value }) => {
        const source = value || siblingData?.title || siblingData?.name
        return typeof source === 'string'
          ? source
              .normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
          : value
      },
    ],
  },
  index: true,
  required: true,
  unique: true,
}
