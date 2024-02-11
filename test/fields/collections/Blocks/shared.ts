import type { BlockField } from '../../payload-types'

export const getBlocksFieldSeedData = (prefix?: string): any => [
  {
    blockName: 'First block',
    blockType: prefix ? `${prefix}Content` : 'content',
    text: 'first block',
    richText: [
      {
        children: [{ text: '' }],
      },
    ],
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
