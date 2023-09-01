import type { Field } from '../fields/config/types'

import { extractTranslations } from '../translations/extractTranslations'

const labels = extractTranslations(['version:draft', 'version:published', 'version:status'])

export const statuses = [
  {
    label: labels['version:draft'],
    value: 'draft',
  },
  {
    label: labels['version:published'],
    value: 'published',
  },
]

const baseVersionFields: Field[] = [
  {
    admin: {
      components: {
        Field: () => null,
      },
      disableBulkEdit: true,
    },
    defaultValue: 'draft',
    label: labels['version:status'],
    name: '_status',
    options: statuses,
    type: 'select',
  },
]

export default baseVersionFields
