import type { CollectionConfig } from 'payload'

export const ForceSelectFn: CollectionConfig<'force-select-fn'> = {
  slug: 'force-select-fn',
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'forceSelectedAlways',
      type: 'text',
    },
    {
      name: 'forceSelectedOnFind',
      type: 'text',
    },
  ],
  forceSelect: ({ operation }) => {
    if (operation === 'find') {
      return { forceSelectedAlways: true, forceSelectedOnFind: true }
    }

    return { forceSelectedAlways: true }
  },
}
