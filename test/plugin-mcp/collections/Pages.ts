import type { CollectionConfig } from 'payload'

export const heroBlockSlug = 'hero'
export const textBlockSlug = 'textContent'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: heroBlockSlug,
          interfaceName: 'HeroBlock',
          fields: [
            {
              name: 'heading',
              type: 'text',
              required: true,
            },
            {
              name: 'subheading',
              type: 'text',
            },
          ],
        },
        {
          slug: textBlockSlug,
          fields: [
            {
              name: 'body',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
}
