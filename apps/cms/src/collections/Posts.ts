import type { CollectionConfig, FieldHook } from 'payload'

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
import {
  rememberLivePost,
  revalidatePostAfterChange,
  revalidatePostAfterDelete,
} from '../hooks/revalidateWebsite'

/** Stores tags in the form the website uses for its tag pages: "Next.js" -> "next-js" */
const normalizeTags: FieldHook = ({ value }) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((tag) =>
              String(tag)
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, '-')
                .replace(/^-|-$/g, ''),
            )
            .filter(Boolean),
        ),
      ]
    : value

/**
 * Blog posts for the personal website, shown at `/blog/<slug>` and in its post lists.
 * The website reads published posts anonymously from `GET /api/posts`; drafts stay private.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'publishedAt', '_status', 'featured'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    // What a post that links to this one receives (the website only needs the slug)
    slug: true,
    title: true,
  },
  defaultSort: '-publishedAt',
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
        description:
          'One or two sentences shown on post cards, in search results and in the RSS feed.',
      },
      required: true,
    },
    {
      name: 'images',
      type: 'upload',
      admin: {
        description:
          'The first image is the cover on post cards. All images appear in the gallery at the top of the post.',
      },
      hasMany: true,
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          // The website has nothing to render for embedded documents
          ...rootFeatures.filter((feature) => feature.key !== 'relationship'),
          // The post title is the page's h1
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          // Internal links can only point at other posts (/blog/<slug> on the website)
          LinkFeature({ enabledCollections: ['posts'] }),
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
        description: 'The post is published at /blog/<slug>.',
      },
      useAsSlug: 'title',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'Set automatically when the post is first published. Posts are sorted by it.',
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) =>
            value || siblingData._status !== 'published' ? value : new Date().toISOString(),
        ],
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      admin: {
        description: 'Show this post under "Featured" on the home page.',
        position: 'sidebar',
      },
      defaultValue: false,
    },
    {
      name: 'tags',
      type: 'text',
      admin: {
        description:
          'e.g. react, next-js. A tag links to its page on the website when one exists (content/tags/<tag>.md).',
        position: 'sidebar',
      },
      hasMany: true,
      hooks: {
        beforeChange: [normalizeTags],
      },
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
  hooks: {
    afterChange: [revalidatePostAfterChange],
    afterDelete: [revalidatePostAfterDelete],
    beforeChange: [rememberLivePost],
  },
  versions: {
    drafts: true,
  },
}
