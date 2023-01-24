import { Payload } from 'payload';
import { draftPage } from './draftPage';
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

  const draftPageJSON = JSON.parse(JSON.stringify(draftPage));

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  });

  const { id: draftPageID } = await payload.create({
    collection: 'pages',
    data: draftPageJSON,
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
              value: draftPageID
            },
            label: 'Draft Page',
          }
        },
      ]
    }
  })
};
