import type { RequiredDataFromCollection } from 'payload/types'

import type { CollapsibleField } from '../../payload-types.js'

export const collapsibleDoc: RequiredDataFromCollection<CollapsibleField> = {
  text: 'Seeded collapsible doc',
  group: {
    textWithinGroup: 'some text within a group',
    subGroup: {
      textWithinSubGroup: 'hello, get out',
    },
  },
  arrayWithCollapsibles: [
    {
      innerCollapsible: '',
    },
  ],
}
