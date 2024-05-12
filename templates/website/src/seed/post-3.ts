import type { Post } from '../payload-types'

export const post3: Partial<Post> = {
  slug: 'post-3',
  _status: 'published',
  authors: ['{{AUTHOR}}'],
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
              text: "This content is completely dynamic using the rich text editor configured in the CMS. This can also contain anything you'd like from images, to highly designed, complex blocks.",
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
  hero: {
    type: 'lowImpact',
    links: null,
    media: null,
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
                text: 'Post 3',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            tag: 'h1',
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
  meta: {
    description: 'This is the third post.',
    image: '{{IMAGE}}',
    title: 'Post 3',
  },
  relatedPosts: [], // this is populated by the seed script
  title: 'Post 3',
}
