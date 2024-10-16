import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'

import { versionSnapshotField } from './baseFields.js'

export const buildVersionCollectionFields = (
  config: SanitizedConfig,
  collection: SanitizedCollectionConfig,
): Field[] => {
  const fields: Field[] = [
    {
      name: 'parent',
      type: 'relationship',
      index: true,
      relationTo: collection.slug,
    },
    {
      name: 'version',
      type: 'group',
      fields: collection.fields.filter((field) => !('name' in field) || field.name !== 'id'),
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        disabled: true,
      },
      index: true,
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        disabled: true,
      },
      index: true,
    },
  ]

  if (collection?.versions?.drafts) {
    if (config.localization) {
      fields.push(versionSnapshotField)

      fields.push({
        name: 'publishedLocale',
        type: 'select',
        admin: {
          disableBulkEdit: true,
          disabled: true,
        },
        index: true,
        options: config.localization.locales.map((locale) => {
          if (typeof locale === 'string') {
            return locale
          }

          return locale.code
        }),
      })
    }

    fields.push({
      name: 'latest',
      type: 'checkbox',
      admin: {
        disabled: true,
      },
      index: true,
    })

    if (collection?.versions?.drafts?.autosave) {
      fields.push({
        name: 'autosave',
        type: 'checkbox',
        index: true,
      })
    }
  }

  return fields
}
