// @ts-strict-ignore
import type { CheckboxField, Field, Option } from '../fields/config/types.js'

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

// Internal field kept for migration compatibility — the snapshot column must exist in the DB
// schema until users run the localize-status predefined migration which drops it.
// This field is NOT exported publicly and is admin-disabled.
export const versionSnapshotField: CheckboxField = {
  name: 'snapshot',
  type: 'checkbox',
  admin: {
    disabled: true,
  },
  index: true,
}

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
