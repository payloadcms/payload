import type { Block, BlockSlug } from 'payload'

import {
  AsyncHooksBlock,
  CodeBlock,
  ConditionalLayoutBlock,
  FilterOptionsBlock,
  RadioButtonsBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  RichTextBlock,
  SelectFieldBlock,
  SubBlockBlock,
  TabBlock,
  TextBlock,
  UploadAndRichTextBlock,
  ValidationBlock,
  // TODO: decouple blocks from both test suites
} from '../../../lexical/collections/Lexical/blocks.js'

export const lexicalBlocks: (Block | BlockSlug)[] = [
  ValidationBlock,
  FilterOptionsBlock,
  AsyncHooksBlock,
  RichTextBlock,
  TextBlock,
  UploadAndRichTextBlock,
  SelectFieldBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  SubBlockBlock,
  RadioButtonsBlock,
  ConditionalLayoutBlock,
  TabBlock,
  CodeBlock,
  {
    slug: 'myBlock',
    admin: {
      components: {},
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithLabel',
    admin: {
      components: {
        Label: '/collections/Lexical/blockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithBlock',
    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponent.js#BlockComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'BlockRSC',

    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponentRSC.js#BlockComponentRSC',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithBlockAndLabel',
    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponent.js#BlockComponent',
        Label: '/collections/Lexical/blockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
]

export const lexicalInlineBlocks: (Block | BlockSlug)[] = [
  {
    slug: 'AvatarGroup',
    interfaceName: 'AvatarGroupBlock',
    fields: [
      {
        name: 'avatars',
        type: 'array',
        minRows: 1,
        maxRows: 6,
        fields: [
          {
            name: 'image',
            type: 'upload',
            relationTo: 'uploads',
          },
        ],
      },
    ],
  },
  {
    slug: 'myInlineBlock',
    admin: {
      components: {},
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithLabel',
    admin: {
      components: {
        Label: '/collections/Lexical/inlineBlockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithBlock',
    admin: {
      components: {
        Block: '/collections/Lexical/inlineBlockComponents/BlockComponent.js#BlockComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithBlockAndLabel',
    admin: {
      components: {
        Block: '/collections/Lexical/inlineBlockComponents/BlockComponent.js#BlockComponent',
        Label: '/collections/Lexical/inlineBlockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
]
