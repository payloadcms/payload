import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'

export const collectionSlug = 'users'

export default buildConfigWithDefaults({
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
          type: 'select',
          defaultValue: 'user',
          hasMany: true,
          label: 'Role',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          required: true,
          saveToJWT: true,
        },
      ],
    },
  ],
  debug: true,
})
