import { buildConfig } from '../buildConfig';

export const slug = 'users';

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [{
    slug,
    auth: {
      verify: true,
      useAPIKey: true,
      maxLoginAttempts: 2,
    },
    fields: [],
  },
  ],
});
