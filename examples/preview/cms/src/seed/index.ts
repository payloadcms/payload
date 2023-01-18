import { Payload } from 'payload';
import path from 'path';
import { home } from './home';
import { anotherPage } from './another-page';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    }
  });

  const { id: mountainPhotoID } = await payload.create({
    collection: 'media',
    filePath: path.resolve(__dirname, 'mountain-range.jpg'),
    data: {
      alt: 'Mountains',
    },
  });

  const homepageJSON = JSON.parse(JSON.stringify(home).replace(/{{MOUNTAIN_IMAGE}}/g, mountainPhotoID));

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  })

  const anotherPageJSON = JSON.parse(JSON.stringify(anotherPage).replace(/{{MOUNTAIN_IMAGE}}/g, mountainPhotoID));

  const { id: anotherPageID } = await payload.create({
    collection: 'pages',
    data: anotherPageJSON,
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'custom',
            url: 'https://github.com/payloadcms/payload',
            label: 'GitHub',
            newTab: true,
          }
        },
        {
          link: {
            type: 'custom',
            url: 'https://payloadcms.com',
            label: 'Payload',
            newTab: true,
          }
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: anotherPageID
            },
            label: 'Another Page',
          }
        }
      ]
    }
  })
}