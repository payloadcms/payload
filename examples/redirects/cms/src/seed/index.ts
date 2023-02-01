import { Payload } from 'payload';
import { redirectPage } from './redirectPage';
import { home } from './home';
import { internalRedirect } from './internalRedirect';
import { externalRedirect } from './externalRedirect';

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

  const internalRedirectJSON = JSON.parse(JSON.stringify(internalRedirect).replace(/{{REDIRECT_PAGE_ID}}/g, redirectPageID));

   await payload.create({
    collection: 'redirects',
    data: internalRedirectJSON,
  })

  const externalRedirectJSON = JSON.parse(JSON.stringify(externalRedirect));

  await payload.create({
    collection: 'redirects',
    data: externalRedirectJSON,
  })

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
