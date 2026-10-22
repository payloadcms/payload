import type { CollectionConfig } from 'payload'

export const heroBlockSlug = 'hero'
export const textBlockSlug = 'textContent'

export const Pages: CollectionConfig = {
  slug: 'pages',
  llmInstructions:
    '## System LLM instructions for the Pages Collection\n\n### What to Include\n\n- Use clear headings and concise page content.\n- Use the configured layout blocks.\n\n### What to Avoid\n\n- Do not publish a page without a title.',
  access: {
    update: ({ id, req }) => {
      const idType = req.payload.collections.pages?.customIDType ?? req.payload.db.defaultIDType

      return id === undefined || typeof id === (idType === 'number' ? 'number' : 'string')
    },
  },
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
  versions: false,
}
