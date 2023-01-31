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

  const redirectPageJSON = JSON.parse(JSON.stringify(redirectPage));

  const { id: redirectPageID } = await payload.create({
    collection: 'pages',
    data: redirectPageJSON,
  });

  const homepageJSON = JSON.parse(JSON.stringify(home));

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
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
