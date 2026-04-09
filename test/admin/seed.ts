import type { Payload } from 'payload'

import { executePromises } from '../__helpers/shared/executePromises.js'
import { devUser } from '../credentials.js'
import {
  customDocumentControlsSlug,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  fullyFeaturedCollectionSlug,
  geoCollectionSlug,
  localizedCollectionSlug,
  noApiViewCollectionSlug,
  postsCollectionSlug,
  usersCollectionSlug,
  with300DocumentsSlug,
} from './slugs.js'

export const seed = async (_payload: Payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: usersCollectionSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'base-list-filters',
          data: {
            title: 'show me',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'base-list-filters',
          data: {
            title: 'hide me',
          },
          depth: 0,
          overrideAccess: true,
        }),
      ...[...Array(11)].map((_, i) => async () => {
        const postDoc = await _payload.create({
          collection: postsCollectionSlug,
          data: {
            description: 'Description',
            title: `Post ${i + 1}`,
            disableListColumnText: 'Disable List Column Text',
            disableListFilterText: 'Disable List Filter Text',
          },
          depth: 0,
          overrideAccess: true,
        })

        return await _payload.update({
          collection: postsCollectionSlug,
          where: {
            id: {
              equals: postDoc.id,
            },
          },
          data: {
            relationship: postDoc.id,
          },
          depth: 0,
          overrideAccess: true,
        })
      }),
      () =>
        _payload.create({
          collection: customDocumentControlsSlug,
          data: {
            title: 'Custom Document Controls',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: customViews1CollectionSlug,
          data: {
            title: 'Custom View',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: customViews2CollectionSlug,
          data: {
            title: 'Custom View',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [7, -7],
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [5, -5],
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: noApiViewCollectionSlug,
          data: {},
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: localizedCollectionSlug,
          data: {
            title: 'Localized Doc',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: fullyFeaturedCollectionSlug,
          data: {
            title: 'Welcome to Payload',
            slug: 'welcome-to-payload',
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'This is a fully featured document with rich text, blocks, arrays, and localized fields.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            excerpt:
              'A pre-seeded document demonstrating all field types in the fully featured collection.',
            layout: [
              {
                blockType: 'richTextBlock',
                richText: {
                  root: {
                    type: 'root',
                    children: [
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'This is a rich text block inside the layout builder.',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                },
              },
              {
                blockType: 'ctaBlock',
                heading: 'Get Started',
                description: 'Learn how to build with Payload CMS.',
                links: [
                  {
                    label: 'Documentation',
                    url: 'https://payloadcms.com/docs',
                    style: 'primary',
                  },
                  {
                    label: 'GitHub',
                    url: 'https://github.com/payloadcms/payload',
                    style: 'secondary',
                  },
                ],
              },
              {
                blockType: 'cardGridBlock',
                cards: [
                  {
                    title: 'Rich Text',
                    description: 'Lexical-powered rich text editing with full block support.',
                    link: { label: 'Learn more', url: '/docs/rich-text' },
                  },
                  {
                    title: 'Blocks',
                    description: 'Flexible layout building with typed block fields.',
                    link: { label: 'Learn more', url: '/docs/blocks' },
                  },
                  {
                    title: 'Localization',
                    description: 'First-class i18n with per-field locale control.',
                    link: { label: 'Learn more', url: '/docs/localization' },
                  },
                ],
              },
            ],
            tags: [{ tag: 'payload' }, { tag: 'cms' }, { tag: 'testing' }],
            category: 'tutorial',
            priority: 8,
            status: 'published',
            isFeatured: true,
            seo: {
              metaTitle: 'Welcome to Payload - Fully Featured Test',
              metaDescription:
                'A comprehensive test document showcasing rich text, blocks, arrays, and localization.',
              noIndex: false,
            },
          },
          depth: 0,
          overrideAccess: true,
        }),
    ],
    false,
  )

  // delete all with300Documents
  await _payload.delete({
    collection: with300DocumentsSlug,
    where: {},
  })

  // Create 300 documents of with300Documents
  const manyDocumentsPromises: Promise<unknown>[] = Array.from({ length: 300 }, (_, i) => {
    const index = (i + 1).toString().padStart(3, '0')
    return _payload.create({
      collection: with300DocumentsSlug,
      data: {
        id: index,
        text: `document ${index}`,
      },
    })
  })

  await Promise.all([...manyDocumentsPromises])
}
