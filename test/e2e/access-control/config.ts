import { devUser } from '../../credentials';
import { buildConfig } from '../buildConfig';
import type { ReadOnlyCollection } from './payload-types';

export const slug = 'access-controls';
export const readOnlySlug = 'read-only-collection';
export const restrictedSlug = 'restricted';

export default buildConfig({
  collections: [
    {
      slug,
      fields: [
        {
          name: 'restrictedField',
          type: 'text',
          access: {
            read: () => false,
          },
        },
      ],
    },
    {
      slug: restrictedSlug,
      fields: [],
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
        delete: () => false,
      },
    },
    {
      slug: readOnlySlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        create: () => false,
        read: () => true,
        update: () => false,
        delete: () => false,
      },
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await payload.create({
      collection: slug,
      data: {
        restrictedField: 'restricted',
      },
    });

    await payload.create<ReadOnlyCollection>({
      collection: readOnlySlug,
      data: {
        name: 'read-only',
      },
    });
  },
});
