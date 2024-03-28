import type { BlockField } from '../../payload-types.js'

export const getBlocksFieldSeedData = (prefix?: string): any => [
  {
    blockName: 'First block',
    blockType: prefix ? `${prefix}Content` : 'content',
    text: 'first block',
    richText: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,

        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
      },
    },
  },
  {
    blockName: 'Second block',
    blockType: prefix ? `${prefix}Number` : 'number',
    number: 342,
  },
  {
    blockName: 'Sub-block demonstration',
    blockType: prefix ? `${prefix}SubBlocks` : 'subBlocks',
    subBlocks: [
      {
        blockName: 'First sub block',
        blockType: 'number',
        number: 123,
      },
      {
        blockName: 'Second sub block',
        blockType: 'text',
        text: 'second sub block',
      },
    ],
  },
  {
    blockName: 'I18n Block',
    blockType: 'i18n-text',
    text: 'first block',
  },
]

export const blocksDoc: Partial<BlockField> = {
  blocks: getBlocksFieldSeedData(),
  localizedBlocks: getBlocksFieldSeedData('localized'),
  blocksWithMinRows: [
    {
      blockTitle: 'first row',
      blockType: 'block',
    },
    {
      blockTitle: 'second row',
      blockType: 'block',
    },
  ],
}
