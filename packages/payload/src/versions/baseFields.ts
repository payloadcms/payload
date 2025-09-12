// @ts-strict-ignore
import type { SanitizedConfig } from '../config/types.js'
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

export const baseVersionFields: Field[] = [
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

export function buildLocaleStatusField(config: SanitizedConfig): Field[] {
  if (!config.localization || !config.localization.locales) {
    return []
  }

  return config.localization.locales.map((locale) => {
    const code = typeof locale === 'string' ? locale : locale.code

    return {
      name: code,
      type: 'select',
      index: true,
      options: [
        { label: ({ t }) => t('version:draft'), value: 'draft' },
        { label: ({ t }) => t('version:published'), value: 'published' },
      ],
    }
  })
}

export function buildLocaleUpdatedAtFields(config: SanitizedConfig): Field[] {
  if (!config.localization || !config.localization.locales) {
    return []
  }

  return config.localization.locales.map((locale) => {
    const code = typeof locale === 'string' ? locale : locale.code

    return {
      name: code,
      type: 'date',
      index: true,
    }
  })
}
