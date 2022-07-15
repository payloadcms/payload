import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';

export const slug = 'access-controls';
export const readOnlySlug = 'read-only-collection';
export const restrictedSlug = 'restricted';
export const restrictedVersionsSlug = 'restricted-versions';

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
    {
      slug: restrictedVersionsSlug,
      versions: true,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      access: {
        readVersions: () => false,
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

    await payload.create({
      collection: readOnlySlug,
      data: {
        name: 'read-only',
      },
    });

    await payload.create({
      collection: restrictedVersionsSlug,
      data: {
        name: 'versioned',
      },
    });
  },
});
