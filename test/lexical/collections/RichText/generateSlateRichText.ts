import { loremIpsum } from './loremIpsum.js'

export function generateSlateRichText() {
  return [
    {
      children: [
        {
          text: "Hello, I'm a rich text field.",
        },
      ],
      type: 'h1',
      textAlign: 'center',
    },
    {
      children: [
        {
          text: 'I can do all kinds of fun stuff like ',
        },
        {
          type: 'link',
          url: 'https://payloadcms.com',
          newTab: true,
          children: [
            {
              text: 'render links',
            },
          ],
        },
        {
          text: ', ',
        },
        {
          type: 'link',
          linkType: 'internal',
          doc: {
            value: '{{ARRAY_DOC_ID}}',
            relationTo: 'array-fields',
          },
          fields: {},
          children: [
            {
              text: 'link to relationships',
            },
          ],
        },
        {
          text: ', and store nested relationship fields:',
        },
      ],
    },
    {
      children: [
        {
          text: '',
        },
      ],
      type: 'relationship',
      value: {
        id: '{{TEXT_DOC_ID}}',
      },
      relationTo: 'text-fields',
    },
    {
      children: [
        {
          text: 'You can build your own elements, too.',
        },
      ],
    },
    {
      type: 'ul',
      children: [
        {
          children: [
            {
              // This node is untyped, because I want to test this scenario:
              // https://github.com/payloadcms/payload/pull/13202
              children: [
                {
                  text: 'This editor is built ',
                },
                {
                  text: 'with SlateJS',
                },
              ],
            },
          ],
          type: 'li',
        },
        {
          type: 'li',
          children: [
            {
              text: 'It stores content as JSON so you can use it wherever you need',
            },
          ],
        },
        {
          type: 'li',
          children: [
            {
              text: "It's got a great editing experience for non-technical users",
            },
          ],
        },
      ],
    },
    {
      children: [
        {
          text: 'And a whole lot more.',
        },
      ],
    },
    {
      children: [
        {
          text: '',
        },
      ],
      type: 'upload',
      value: {
        id: '{{UPLOAD_DOC_ID}}',
      },
      relationTo: 'uploads',
      fields: {
        caption: [
          ...[...Array(4)].map(() => {
            return {
              children: [
                {
                  text: loremIpsum,
                },
              ],
            }
          }),
        ],
      },
    },
    {
      children: [
        {
          text: '',
        },
      ],
    },
    ...[...Array(2)].map(() => {
      return {
        children: [
          {
            text: loremIpsum,
          },
        ],
      }
    }),
  ]
}
