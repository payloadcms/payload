export const arrayDoc = {
  items: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
    {
      text: 'third row',
    },
    {
      text: 'fourth row',
    },
    {
      text: 'fifth row',
    },
    {
      text: 'sixth row',
    },
  ],
};

export const blocksDoc = {
  blocks: [
    {
      blockName: 'First block',
      blockType: 'text',
      text: 'first block',
    },
    {
      blockName: 'Second block',
      blockType: 'number',
      number: 342,
    },
  ],
};

export const collapsibleDoc = {
  text: 'Seeded collapsible doc',
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
          text: 'I can do all kinds of fun stuff like render links and store nested relationship fields:',
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
      value: { id: '' },
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

export const textDoc = {
  text: 'Seeded text document',
};
