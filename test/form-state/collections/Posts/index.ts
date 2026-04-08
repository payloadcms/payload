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
      name: 'computedTitle',
      type: 'text',
      hooks: {
        beforeChange: [({ data }) => data?.title],
      },
      label: 'Computed Title',
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
        {
          name: 'defaultTextField',
          type: 'text',
        },
      ],
    },
    {
      name: 'computedArray',
      type: 'array',
      admin: {
        description:
          'If there is no value, a default row will be added by a beforeChange hook. Otherwise, modifies the rows on save.',
      },
      hooks: {
        beforeChange: [
          ({ value }) =>
            !value?.length
              ? [
                  {
                    text: 'This is a computed value.',
                  },
                ]
              : value,
        ],
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Unnamed Tab',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 'namedTab',
                  fields: [
                    {
                      name: 'arrayInNamedTabInUnnamedTab',
                      type: 'array',
                      fields: [
                        {
                          name: 'textInArrayInNamedTabInUnnamedTab',
                          type: 'text',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
