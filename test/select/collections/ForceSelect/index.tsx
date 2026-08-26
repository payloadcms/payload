import type { CollectionConfig } from 'payload'

export const ForceSelect: CollectionConfig<'force-select'> = {
  slug: 'force-select',
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'field1',
      type: 'text',
    },
    {
      name: 'field2',
      type: 'text',
    },
  ],
  select: ({ select }) => {
    if (!select) {
      return undefined
    }

    if (select.field1) {
      return {
        ...select,
        field2: true,
      }
    }

    return select
  },
}
