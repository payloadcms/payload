import type { MigrateUpArgs } from '@payloadcms/db-mongodb'

import type { Page } from '../payload-types'

export const home: Partial<Page> = {
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
          url: 'https://payloadcms.com/docs/live-preview',
        },
        {
          text: ' you can edit this page in the admin panel and see the changes reflected here in real time.',
        },
      ],
    },
  ],
  title: 'Home',
}

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

  const homepageJSON = JSON.parse(JSON.stringify(home))

  const { id: homePageID } = await payload.create({
    collection: 'pages',
    data: homepageJSON,
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
            url: 'http://localhost:3000/admin',
          },
        },
      ],
    },
  })
}
