import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

import { buildEditorState } from '@payloadcms/richtext-lexical'

import type { Page } from '../payload-types.js'

import { postsSlug } from '../shared.js'

export const postsPage: Partial<Page> = {
  title: 'Posts',
  slug: 'posts',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE}}',
  },
  hero: {
    type: 'lowImpact',
    richText: buildEditorState<DefaultNodeTypes>({
      nodes: [
        {
          type: 'heading',
          tag: 'h1',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'All posts',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'This is an example of live preview on a page. You can edit this page in the admin panel and see the changes reflected here.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        },
      ],
    }),
    media: undefined,
  },
  layout: [
    {
      blockName: 'Archive Block',
      blockType: 'archive',
      introContent: buildEditorState<DefaultNodeTypes>({
        nodes: [
          {
            type: 'heading',
            tag: 'h4',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'All posts',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'This is a custom layout building block. You can edit this block in the admin panel and see the changes reflected here.',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          },
        ],
      }),
      populateBy: 'collection',
      relationTo: postsSlug,
      limit: 10,
      categories: [],
    },
  ],
}
