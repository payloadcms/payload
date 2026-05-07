import type { Block, CollectionConfig } from 'payload'

import { blocksFieldsSlug } from '../../slugs.js'

const testBlock: Block = {
  slug: 'test-block',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
}

const heroBlock: Block = {
  slug: 'hero-block',
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
}

const callToActionBlock: Block = {
  slug: 'call-to-action-block',
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
    },
  ],
}

const imageBlock: Block = {
  slug: 'image-block',
  fields: [
    {
      name: 'caption',
      type: 'text',
    },
  ],
}

const quoteBlock: Block = {
  slug: 'quote-block',
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
    },
  ],
}

const testBlockRequired: Block = {
  slug: 'test-block-required',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
}

const innerBlock: Block = {
  slug: 'inner-block',
  fields: [
    {
      name: 'innerText',
      type: 'text',
    },
  ],
}

const outerBlock: Block = {
  slug: 'outer-block',
  fields: [
    {
      name: 'outerText',
      type: 'text',
    },
    {
      name: 'nestedBlocks',
      type: 'blocks',
      blocks: [innerBlock, testBlock],
    },
  ],
}

const BlocksFields: CollectionConfig = {
  slug: blocksFieldsSlug,
  fields: [
    {
      name: 'multipleBlockTypes',
      type: 'blocks',
      label: 'Multiple Block Types',
      admin: {
        description: 'A block field with multiple block types.',
      },
      blocks: [testBlock, heroBlock, callToActionBlock, imageBlock, quoteBlock],
    },
    {
      name: 'blocksWithRequiredField',
      type: 'blocks',
      label: 'Blocks With Required Field',
      blocks: [testBlockRequired],
    },
    {
      name: 'blocksWithMinRows',
      type: 'blocks',
      minRows: 2,
      blocks: [testBlock],
    },
    {
      name: 'readOnlyBlocks',
      type: 'blocks',
      label: 'Read Only Blocks',
      admin: {
        readOnly: true,
      },
      blocks: [testBlock],
    },
    {
      name: 'nestedBlocksField',
      type: 'blocks',
      label: 'Nested Blocks',
      blocks: [outerBlock],
    },
  ],
}

export default BlocksFields
