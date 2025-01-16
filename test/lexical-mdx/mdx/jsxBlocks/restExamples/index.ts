import type { Block } from 'payload'

export const RestExamplesBlock: Block = {
  slug: 'restExamples',
  fields: [
    {
      name: 'data',
      type: 'array',
      fields: [
        {
          name: 'operation',
          type: 'text',
        },
        {
          name: 'method',
          type: 'text',
        },
        {
          name: 'path',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'example',
          type: 'group',
          fields: [
            {
              name: 'slug',
              type: 'text',
            },
            {
              name: 'req',
              type: 'json',
            },
            {
              name: 'res',
              type: 'json',
            },
            {
              name: 'drawerContent',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
  interfaceName: 'RestExamplesBlock',
  jsx: {
    export: ({ fields, lexicalToMarkdown }) => {
      return {
        props: {
          data: fields.data.map((item) => {
            return {
              ...item,
              example: {
                ...item.example,
                drawerContent:
                  lexicalToMarkdown && item.example.drawerContent
                    ? item.example.drawerContent
                    : undefined,
              },
            }
          }),
        },
      }
    },
    import: ({ children, markdownToLexical, props }) => {
      return {
        data: props.data.map((item) => {
          return {
            ...item,
            example: {
              ...item.example,
              drawerContent:
                markdownToLexical && item.example.drawerContent
                  ? item.example.drawerContent
                  : undefined,
            },
          }
        }),
      }
    },
  },
}
