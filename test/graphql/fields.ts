import type { Field } from 'payload'

export const hiddenFields: Field[] = [
  { name: 'visible', type: 'text' },
  { name: 'adminOnly', type: 'text', admin: { hidden: true } },
  { name: 'secret', type: 'text', hidden: true, defaultValue: 'internal default', required: true },
  {
    name: 'hookSecret',
    type: 'text',
    hidden: true,
    hooks: { beforeChange: [() => 'internal hook'] },
  },
  {
    name: 'group',
    type: 'group',
    fields: [
      { name: 'visible', type: 'text' },
      { name: 'secret', type: 'text', hidden: true, required: true, defaultValue: 'group default' },
    ],
  },
  {
    name: 'emptyGroup',
    type: 'group',
    fields: [{ name: 'secret', type: 'text', hidden: true }],
  },
  {
    name: 'rows',
    type: 'array',
    fields: [
      { name: 'visible', type: 'text' },
      { name: 'secret', type: 'text', hidden: true },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'rowVisible', type: 'text' },
      { name: 'rowSecret', type: 'text', hidden: true },
    ],
  },
  {
    type: 'collapsible',
    label: 'Collapsible',
    fields: [
      { name: 'collapsibleVisible', type: 'text' },
      { name: 'collapsibleSecret', type: 'text', hidden: true },
    ],
  },
  {
    type: 'group',
    fields: [
      { name: 'unnamedGroupVisible', type: 'text' },
      { name: 'unnamedGroupSecret', type: 'text', hidden: true },
    ],
  },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Unnamed tab',
        fields: [
          { name: 'tabVisible', type: 'text' },
          { name: 'tabSecret', type: 'text', hidden: true },
        ],
      },
      {
        name: 'namedTab',
        fields: [
          { name: 'visible', type: 'text' },
          { name: 'secret', type: 'text', hidden: true },
        ],
      },
      {
        name: 'emptyTab',
        fields: [{ name: 'secret', type: 'text', hidden: true }],
      },
    ],
  },
  {
    name: 'hiddenBlocks',
    type: 'blocks',
    hidden: true,
    blocks: [{ slug: 'hidden-block', fields: [{ name: 'value', type: 'text' }] }],
  },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [
      {
        slug: 'hidden-fields-content',
        fields: [
          { name: 'visible', type: 'text' },
          { name: 'secret', type: 'text', hidden: true },
        ],
      },
    ],
  },
]
