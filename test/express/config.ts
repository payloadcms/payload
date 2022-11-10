import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';


const { email, password } = devUser;
export const slug = 'users';
export const organizationSlug = 'organization';

export default buildConfig({
  admin: {
    user: slug,
  },
  collections: [
    {
      slug,
      auth: true,
      fields: [],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: slug,
      data: {email, password}
    })
  }
});
