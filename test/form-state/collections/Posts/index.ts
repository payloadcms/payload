import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'renderTracker',
      type: 'text',
      admin: {
        components: {
          Field: './collections/Posts/RenderTracker.js#RenderTracker',
        },
      },
    },
    {
      name: 'validateUsingEvent',
      type: 'text',
      admin: {
        description:
          'This field should only validate on submit. Try typing "Not allowed" and submitting the form.',
      },
      validate: (value, { event }) => {
        if (event === 'onChange') {
          return true
        }

        if (value === 'Not allowed') {
          return 'This field has been validated only on submit'
        }

        return true
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'text',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'number',
          fields: [
            {
              name: 'number',
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      admin: {
        components: {
          RowLabel: './collections/Posts/ArrayRowLabel.js#ArrayRowLabel',
        },
      },
      fields: [
        {
          name: 'customTextField',
          type: 'text',
          defaultValue: 'This is a default value',
          admin: {
            components: {
              Field: './collections/Posts/TextField.js#CustomTextField',
            },
          },
        },
      ],
    },
  ],
}
