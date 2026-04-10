import type { GroupField } from '../../payload-types.js'

export const namedGroupDoc: Partial<GroupField> = {
  group: {
    text: 'some text within a group',
    subGroup: {
      textWithinGroup: 'please',
      arrayWithinGroup: [
        {
          textWithinArray: 'text in a group and array',
        },
      ],
    },
  },
  insideUnnamedGroup: 'text in unnamed group',
  deeplyNestedGroup: {
    insideNestedUnnamedGroup: 'text in nested unnamed group',
  },
}
