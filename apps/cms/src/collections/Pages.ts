import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical'

import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { Code } from '../blocks/Code'
import { YouTube } from '../blocks/YouTube'

/**
 * Standalone pages such as "About", "Services" or "Uses", read through `GET /api/pages`.
 * Fetch one with `?where[slug][equals]=<slug>`; only published pages are visible without logging in.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    // What a document that links to this page receives
    slug: true,
    title: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'One or two sentences for search results and link previews.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures.filter((feature) => feature.key !== 'relationship'),
          // The page title is the page's h1
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          LinkFeature({ enabledCollections: ['pages', 'posts'] }),
          BlocksFeature({ blocks: [Code, YouTube] }),
          FixedToolbarFeature(),
        ],
      }),
      required: true,
    },
    {
      name: 'slug',
      type: 'slug',
      admin: {
        description: 'Identifies the page, e.g. "about" for /about.',
      },
      useAsSlug: 'title',
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description:
          'Optional. Overrides the title and description shown by search engines and link previews.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
      label: 'SEO',
    },
  ],
  versions: {
    drafts: true,
  },
}
