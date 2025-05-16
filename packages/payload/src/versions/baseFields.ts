// @ts-strict-ignore
import type { CheckboxField, Field } from '../fields/config/types.js'

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

// When publishing a specific locale,
// we need to create a new draft which acts as a
// "snapshot" to retain all existing draft data.
// This field will be used to exclude any snapshot versions
// from the admin Versions list
export const versionSnapshotField: CheckboxField = {
  name: 'snapshot',
  type: 'checkbox',
  admin: {
    disableBulkEdit: true,
    disabled: true,
  },
  index: true,
}

export default baseVersionFields
