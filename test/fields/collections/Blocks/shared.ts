import type { BlockField } from '../../payload-types.js'

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
        blockType: 'textRequired',
        text: 'second sub block',
      },
    ],
  },
  {
    blockType: prefix ? `${prefix}NoBlockname` : 'noBlockname',
    text: 'Hello world',
  },
]

export const blocksDoc: Partial<BlockField> = {
  blocks: getBlocksFieldSeedData(),
  localizedBlocks: getBlocksFieldSeedData('localized'),
  blocksWithMinRows: [
    {
      blockTitle: 'first row',
      blockType: 'blockWithMinRows',
    },
    {
      blockTitle: 'second row',
      blockType: 'blockWithMinRows',
    },
  ],
  localizedReferencesLocalizedBlock: [
    {
      blockType: 'localizedTextReference',
      text: 'localized text',
    },
  ],
  localizedReferences: [
    {
      blockType: 'localizedTextReference2',
      text: 'localized text',
    },
  ],
}
