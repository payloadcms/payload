import type { CollectionConfig } from 'payload/types'

export const groupSlug = 'groups'

export const Group: CollectionConfig = {
  slug: groupSlug,
  fields: [
    {
      name: 'groupLocalized',
      localized: true,
      type: 'group',
      fields: [
        // {
        //   name: 'title',
        //   type: 'text',
        // },
      ],
    },
    // {
    //   name: 'group',
    //   type: 'group',
    //   fields: [
    //     {
    //       localized: true,
    //       name: 'title',
    //       type: 'text',
    //     },
    //   ],
    // },
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
  ],
}
