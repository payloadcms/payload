import type { GroupField } from '../../payload-types'

export const groupDoc: Partial<GroupField> = {
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
}
