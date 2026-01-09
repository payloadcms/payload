import { fieldPathsSlug } from './shared.js'

export const testDoc = {
  collection: fieldPathsSlug,
  data: {
    topLevelNamedField: 'Test',
    array: [
      {
        fieldWithinArray: 'Test',
        nestedArray: [
          {
            fieldWithinNestedArray: 'Test',
          },
        ],
      },
    ],
    fieldWithinRow: 'Test',
    fieldWithinUnnamedTab: 'Test',
    namedTab: {
      fieldWithinNamedTab: 'Test',
    },
    fieldWithinNestedUnnamedTab: 'Test',
    fieldWithinUnnamedTabWithinCollapsible: 'Test',
    textFieldInUnnamedGroup: 'Test',
    blocks: [
      {
        blockType: 'CollapsibleBlock',
        textInCollapsibleInCollapsibleBlock: 'Test',
      },
    ],
  },
}
