import type { CollectionConfig, FieldHook } from 'payload/types'

const populateFullTitle: FieldHook = ({ data }) => {
  if (!data) return ''
  return `${data.title} ${data.firstName} ${data.lastName}`
}

export const Staff: CollectionConfig = {
  slug: 'staff',
  admin: {
    defaultColumns: ['fullTitle', 'location'],
    useAsTitle: 'fullTitle',
  },
  fields: [
    {
      name: 'fullTitle',
      type: 'text',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [populateFullTitle],
        beforeChange: [
          ({ siblingData }) => {
            // Mutate the sibling data to prevent DB storage
            // eslint-disable-next-line no-param-reassign
            siblingData.fullTitle = undefined
          },
        ],
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'relationship',
      hasMany: true,
      maxDepth: 0,
      relationTo: 'locations',
      required: true,
    },
  ],
}
