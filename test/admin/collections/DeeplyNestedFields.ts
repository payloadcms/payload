import type { ArrayField, Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { deeplyNestedFieldsSlug } from '../shared.js'

const richTextLayoutBlockGridBoxes2: ArrayField = {
  name: 'gridBx',
  labels: { singular: 'Grid Box', plural: 'Grid Boxes' },
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [],
    },
  ],
}

const richTextLayoutBlock2: Block = {
  slug: 'layout',
  interfaceName: 'RichTextLayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [richTextLayoutBlockGridBoxes2],
}

const richTextBlock2: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [
    {
      name: 'richTextContent',
      label: 'Rich Text',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [richTextLayoutBlock2] }),
        ],
      }),
    },
  ],
}

const richTextLayoutBlockGridBoxes1: ArrayField = {
  name: 'gridBx',
  labels: { singular: 'Grid Box', plural: 'Grid Boxes' },
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [richTextBlock2],
    },
  ],
}

const richTextLayoutBlock1: Block = {
  slug: 'layout',
  interfaceName: 'RichTextLayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [richTextLayoutBlockGridBoxes1],
}

const richTextBlock1: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [
    {
      name: 'richTextContent',
      label: 'Rich Text',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [richTextLayoutBlock1] }),
        ],
      }),
    },
  ],
}

const richTextLayoutBlockGridBoxes: ArrayField = {
  name: 'gridBx',
  labels: { singular: 'Grid Box', plural: 'Grid Boxes' },
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [richTextBlock1],
    },
  ],
}

const richTextLayoutBlock: Block = {
  slug: 'layout',
  interfaceName: 'RichTextLayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [richTextLayoutBlockGridBoxes],
}

const richTextBlock: Block = {
  slug: 'rich-text',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  fields: [
    {
      name: 'richTextContent',
      label: 'Rich Text',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [richTextLayoutBlock] }),
        ],
      }),
    },
  ],
}

const layoutBlockGridBoxes2: ArrayField = {
  name: 'gridBx',
  label: 'Grid Boxes',
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [richTextBlock],
    },
  ],
}

const layoutBlock2: Block = {
  slug: 'layout',
  interfaceName: 'LayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [layoutBlockGridBoxes2],
}

const layoutBlockGridBoxes1: ArrayField = {
  name: 'gridBx',
  label: 'Grid Boxes',
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [layoutBlock2, richTextBlock],
    },
  ],
}

const layoutBlock1: Block = {
  slug: 'layout',
  interfaceName: 'LayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [layoutBlockGridBoxes1],
}

const layoutBlockGridBoxes: ArrayField = {
  name: 'gridBx',
  labels: { singular: 'Grid Box', plural: 'Grid Boxes' },
  type: 'array',
  fields: [
    {
      name: 'gridBx',
      label: 'Grid Box Content',
      type: 'blocks',
      maxRows: 1,
      blocks: [layoutBlock1, richTextBlock],
    },
  ],
}

const layoutBlock: Block = {
  slug: 'layout',
  interfaceName: 'LayoutBlock',
  labels: { singular: 'Layout', plural: 'Layout' },
  fields: [layoutBlockGridBoxes],
}

export const DeeplyNestedFields: CollectionConfig = {
  slug: deeplyNestedFieldsSlug,
  fields: [
    {
      name: 'content',
      type: 'blocks',
      blocks: [layoutBlock],
    },
  ],
}
