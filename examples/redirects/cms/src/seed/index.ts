import { Payload } from 'payload';
import { redirectPage } from './redirectPage';
import { home } from './home';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  });

  const homepageJSON = JSON.parse(JSON.stringify(home));

  const redirectPageJSON = JSON.parse(JSON.stringify(redirectPage));

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  });

  const { id: redirectPageID } = await payload.create({
    collection: 'pages',
    data: redirectPageJSON,
  });

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: redirectPageID
            },
            label: 'Redirect Page',
          }
        },
      ]
    }
  })
};
