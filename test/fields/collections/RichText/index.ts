import type { CollectionConfig } from '../../../../src/collections/config/types';

const RichTextFields: CollectionConfig = {
  slug: 'rich-text-fields',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      required: true,
    },
  ],
};

export const richTextDoc = {
  richText: [
    {
      children: [
        {
          text: "Hello, I'm a rich text field.",
        },
      ],
      type: 'h1',
    },
    {
      children: [
        {
          text: 'I can do all kinds of fun stuff like ',
        },
        {
          type: 'link',
          url: 'test.com',
          newTab: true,
          children: [
            {
              text: 'render links',
            },
          ],
        },
        {
          text: ' and store nested relationship fields:',
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
        id: '',
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
              text: "It's built with SlateJS",
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
  ],
};


export default RichTextFields;
