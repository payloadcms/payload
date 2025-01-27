import { buildConfigWithDefaults } from '../../buildConfigWithDefaults'

export const collectionSlug = 'users'

export default buildConfigWithDefaults({
  debug: true,
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: collectionSlug,
      auth: {
        removeTokenFromResponses: true,
      },
      fields: [
        {
          name: 'roles',
          label: 'Role',
          type: 'select',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: ['user'],
          required: true,
          saveToJWT: true,
          hasMany: true,
        },
      ],
    },
  ],
})
