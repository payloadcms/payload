// @ts-strict-ignore
import type { Option } from '../fields/config/types.js'

export const statuses: Option[] = [
  {
    label: ({ t }) => t('version:draft'),
    value: 'draft',
  },
  {
    label: ({ t }) => t('version:published'),
    value: 'published',
  },
]

export const baseVersionFields = ({ localized }: { localized: boolean }): Field[] => [
  {
    name: '_status',
    type: 'select',
    admin: {
      components: {
        Field: false,
      },
      disabled: { bulkEdit: true },
    },
    defaultValue: 'draft',
    index: true,
    label: ({ t }) => t('version:status'),
    localized: Boolean(localized),
    options: statuses,
  },
]
