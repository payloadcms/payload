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
        Field: () => null,
      },
      disableBulkEdit: true,
    },
    defaultValue: 'draft',
    label: ({ t }) => t('version:status'),
    options: statuses,
  },
]

export default baseVersionFields
