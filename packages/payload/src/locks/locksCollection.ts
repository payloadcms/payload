import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'

const lockAccess: Access = ({ req }) => ({
  'user.value': {
    equals: req?.user?.id,
  },
})

export const getLocksCollection = (config: Config): CollectionConfig => ({
  slug: 'payload-locks',
  // access: {
  //   delete: lockAccess,
  //   read: lockAccess,
  // },
  // admin: {
  //   hidden: true,
  // },
  fields: [
    {
      name: 'docId',
      type: 'text',
    },
    {
      name: '_lastEdited',
      type: 'group',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          hooks: {
            beforeValidate: [
              ({ req }) => {
                if (!req?.user) {
                  return null
                }
                return {
                  relationTo: req?.user.collection,
                  value: req?.user.id,
                }
              },
            ],
          },
          relationTo: config.collections
            .filter((collectionConfig) => collectionConfig.auth)
            .map((collectionConfig) => collectionConfig.slug),
          required: true,
        },
        {
          name: 'editedAt',
          type: 'date',
        },
      ],
    },
  ],
})
