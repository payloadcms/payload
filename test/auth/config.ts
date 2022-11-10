import { buildConfig } from '../buildConfig';

export const slug = 'users';
export const organizationSlug = 'organization';

export default buildConfig({
  admin: {
    user: 'users',
  },
  defaultDepth: 10,
  collections: [
    {
      slug,
      auth: {
        tokenExpiration: 7200, // 2 hours
        verify: false,
        maxLoginAttempts: 2,
        lockTime: 600 * 1000, // lock time in ms
        useAPIKey: true,
        depth: 2,
        cookies: {
          secure: false,
          sameSite: 'lax',
          domain: undefined,
        },
      },
      fields: [
        {
          name: 'roles',
          label: 'Role',
          type: 'select',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: 'user',
          required: true,
          saveToJWT: true,
          hasMany: true,
        },
        {
          name: 'organization',
          label: 'Organization',
          type: 'relationship',
          relationTo: organizationSlug,
          saveToJWT: true,
          maxDepth: 10
        }
      ],
    },
    {
      slug: organizationSlug,
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
        }
      ]
    }
  ],
});
