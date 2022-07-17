import { Response } from 'express';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import { PayloadRequest } from '../../src/express/types';

export const slug = 'global';
export const arraySlug = 'array';

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
          name: 'title',
          type: 'text',
        },
      ],
      endpoints: [{
        path: `/${globalsEndpoint}`,
        method: 'post',
        handler: (req: PayloadRequest, res: Response): void => {
          res.json(req.body);
        },
      }],
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
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
  },
});
