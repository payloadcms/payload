import type { FieldPath } from './payload-types.js'

export const testDoc: Partial<FieldPath> = {
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
}
