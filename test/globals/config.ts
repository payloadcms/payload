import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';

export const slug = 'global';
export const arraySlug = 'array';

export const accessControlSlug = 'access-control';

export const englishLocale = 'en';
export const spanishLocale = 'es';

export const globalsEndpoint = 'hello-world';

const access = {
  read: () => true,
  update: () => true,
};

export default buildConfig({
  localization: {
    locales: [englishLocale, spanishLocale],
    defaultLocale: englishLocale,
  },
  globals: [
    {
      slug,
      access,
      fields: [
        {
          name: 'json',
          type: 'json',
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: arraySlug,
      access,
      fields: [
        {
          name: 'array',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: accessControlSlug,
      access: {
        read: ({ req: { user } }) => {
          if (user) {
            return true;
          }

          return {
            enabled: {
              equals: true,
            },
          };
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'enabled',
          type: 'checkbox',
        },
      ],
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

    await payload.updateGlobal({
      slug: accessControlSlug,
      data: {
        title: 'hello',
      },
    });
  },
});
