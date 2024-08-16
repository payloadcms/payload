import type { Field } from '../fields/config/types.js'

export const statuses = [
  {
    label: ({ t }) => t('version:draft'),
    value: 'draft',
  },
  {
    label: ({ t }) => t('version:published'),
    value: 'published',
  },
]

const baseVersionFields: Field[] = [
  {
    name: '_status',
    type: 'select',
    admin: {
      components: {
        Field: false,
      },
      disableBulkEdit: true,
    },
    defaultValue: 'draft',
    index: true,
    label: ({ t }) => t('version:status'),
    options: statuses,
  },
]

export default baseVersionFields
