import type { CollectionConfig } from 'payload'

export const ForceSelectFn: CollectionConfig<'force-select-fn'> = {
  slug: 'force-select-fn',
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
  /**
   * When the caller selects `field1`, force select `field2`.
   */
  select: ({ select }) => {
    if (select?.field1) {
      return { field1: true, field2: true }
    }

    return undefined
  },
}
