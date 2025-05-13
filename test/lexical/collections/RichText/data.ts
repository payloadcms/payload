import { generateLexicalRichText } from './generateLexicalRichText.js'
import { generateSlateRichText } from './generateSlateRichText.js'

export const richTextBlocks = [
  {
    blockType: 'textBlock',
    text: 'Regular text',
  },
  {
    blockType: 'richTextBlockSlate',
    text: [
      {
        children: [
          {
            text: 'Rich text',
          },
        ],
        type: 'h1',
      },
    ],
  },
]
export const richTextDocData = {
  title: 'Rich Text',
  selectHasMany: ['one', 'five'],
  richText: generateSlateRichText(),
  richTextReadOnly: generateSlateRichText(),
  richTextCustomFields: generateSlateRichText(),
  lexicalCustomFields: generateLexicalRichText(),
  blocks: richTextBlocks,
}

export const richTextBulletsDocData = {
  title: 'Bullets and Indentation',
  lexicalCustomFields: generateLexicalRichText(),
  richText: [
    {
      type: 'ul',
      children: [
        {
          type: 'li',
          children: [
            {
              children: [
                {
                  text: 'I am semantically connected to my sub-bullets',
                },
              ],
            },
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am sub-bullets that are semantically connected to the parent bullet',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          children: [
            {
              text: 'Normal bullet',
            },
          ],
          type: 'li',
        },
        {
          type: 'li',
          children: [
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am the old style of sub-bullet',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'li',
          children: [
            {
              text: 'Another normal bullet',
            },
          ],
        },
        {
          type: 'li',
          children: [
            {
              children: [
                {
                  text: 'This text precedes a nested list',
                },
              ],
            },
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am a sub-bullet',
                    },
                  ],
                },
                {
                  type: 'li',
                  children: [
                    {
                      text: 'And I am another sub-bullet',
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
