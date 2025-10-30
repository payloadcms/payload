import type { MigrateUpArgs } from '@payloadcms/db-mongodb'

import type { Page } from '../payload-types'
import { DefaultDocumentIDType } from 'payload'

export const home = (id: DefaultDocumentIDType): Partial<Page> => ({
  slug: 'home',
  richText: [
    {
      type: 'h1',
      children: [
        {
          text: 'Payload Live Preview Example',
        },
      ],
    },
    {
      children: [
        { text: 'This is a ' },
        {
          type: 'link',
          children: [{ text: 'Next.js' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://nextjs.org',
        },
        { text: " app made explicitly for Payload's " },
        {
          type: 'link',
          children: [{ text: 'Live Preview Example' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/master/examples/live-preview/payload',
        },
        { text: '. With ' },
        {
          type: 'link',
          children: [{ text: 'Live Preview' }],
          newTab: true,
          url: 'https://payloadcms.com/docs/live-preview/overview',
        },
        {
          text: ' you can edit this page in the admin panel and see the changes reflected here in real time.',
        },
        ...(id
          ? [
              {
                text: ' To get started, visit ',
              },
              {
                type: 'link',
                children: [{ text: 'this page' }],
                linkType: 'custom',
                newTab: true,
                url: `/admin/collections/pages/${id}/preview`,
              },
              { text: '.' },
            ]
          : []),
      ],
    },
  ],
  title: 'Home',
})

export const examplePage: Partial<Page> = {
  slug: 'example-page',
  richText: [
    {
      type: 'h1',
      children: [
        {
          text: 'Example Page',
        },
      ],
    },
    {
      children: [
        {
          text: 'This is an example page. You can edit this page in the Admin panel and see the changes reflected here in real time.',
        },
      ],
    },
  ],
  title: 'Example Page',
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const { id: examplePageID } = await payload.create({
    collection: 'pages',
    data: examplePage as any, // eslint-disable-line
  })

  const { id: ogHomePageID } = await payload.create({
    collection: 'pages',
    data: {
      title: 'Home',
      richText: [],
    },
  })

  const { id: homePageID } = await payload.update({
    id: ogHomePageID,
    collection: 'pages',
    data: home(ogHomePageID),
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            label: 'Home',
            reference: {
              relationTo: 'pages',
              value: homePageID,
            },
            url: '',
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Example Page',
            reference: {
              relationTo: 'pages',
              value: examplePageID,
            },
            url: '',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Dashboard',
            reference: undefined,
            url: '/admin',
          },
        },
      ],
    },
  })
}
