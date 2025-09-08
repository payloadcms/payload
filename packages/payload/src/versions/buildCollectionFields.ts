import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FlattenedField } from '../fields/config/types.js'

import {
  buildLocaleStatusField,
  buildLocaleUpdatedAtFields,
  versionSnapshotField,
} from './baseFields.js'

export const buildVersionCollectionFields = <T extends boolean = false>(
  config: SanitizedConfig,
  collection: SanitizedCollectionConfig,
  flatten?: T,
): true extends T ? FlattenedField[] : Field[] => {
  const fields: FlattenedField[] = [
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
      ...(flatten && {
        flattenedFields: collection.flattenedFields.filter((each) => each.name !== 'id'),
      })!,
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

      if (config.experimental?.localizeStatus) {
        const localeStatusFields = buildLocaleStatusField(config)

        fields.push({
          name: 'localeStatus',
          type: 'group',
          admin: {
            disableBulkEdit: true,
            disabled: true,
          },
          fields: localeStatusFields,
          ...(flatten && {
            flattenedFields: localeStatusFields as FlattenedField[],
          })!,
        })
      }

      if (config.experimental?.localizeUpdatedAt) {
        const localeUpdatedAtFields = buildLocaleUpdatedAtFields(config)

        fields.push({
          name: 'localeUpdatedAt',
          type: 'group',
          admin: {
            disableBulkEdit: true,
            disabled: true,
          },
          fields: localeUpdatedAtFields,
          ...(flatten && {
            flattenedFields: localeUpdatedAtFields as FlattenedField[],
          })!,
        })
      }
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

  return fields as true extends T ? FlattenedField[] : Field[]
}
