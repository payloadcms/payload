import type { Page } from '../../payload-types'

export const postsPage: Partial<Page> = {
  slug: 'posts',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    media: undefined,
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Hello world hero',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            tag: 'h1',
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
                text: 'This page displays all or some of the posts of your blog. Each post is complete with a dynamic page layout builder for a completely custom user experience that is under your full control.',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
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
  layout: [
    {
      id: '6640559f558bfdddd8333390',
      blockType: 'archive',
      introContent: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
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
              tag: 'h4',
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
                  text: 'The posts below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or posts can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      limit: 10,
      populateBy: 'collection',
      populatedDocs: [
        {
          relationTo: 'posts',
          value: '664054e205e6cfad3742f3dc',
        },
        {
          relationTo: 'posts',
          value: '664054e205e6cfad3742f3d3',
        },
        {
          relationTo: 'posts',
          value: '664054e205e6cfad3742f3ca',
        },
      ],
      populatedDocsTotal: 3,
      relationTo: 'posts',
    },
  ],
  meta: {
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE}}',
    title: 'Payload Website Template',
  },
  title: 'Posts',
}
