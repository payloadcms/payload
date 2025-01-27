import type { CollapsibleField } from '../../payload-types'

export const collapsibleDoc: Partial<CollapsibleField> = {
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
