import type { Field } from 'payload'

export const fields: Field[] = [
  { name: 'title', type: 'text' },
  { name: 'secret', type: 'text' },
  {
    name: 'profile',
    type: 'group',
    fields: [
      { name: 'label', type: 'text', localized: true },
      { name: 'note', type: 'text' },
      { name: 'nested', type: 'group', fields: [{ name: 'value', type: 'text' }] },
      { name: 'rows', type: 'array', fields: [{ name: 'value', type: 'text' }] },
      {
        name: 'content',
        type: 'blocks',
        blocks: [{ slug: 'card', fields: [{ name: 'title', type: 'text' }] }],
      },
    ],
  },
  {
    type: 'tabs',
    tabs: [
      {
        name: 'panel',
        fields: [{ name: 'rows', type: 'array', fields: [{ name: 'value', type: 'text' }] }],
      },
    ],
  },
]
