// @ts-strict-ignore
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FlattenedField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { versionSnapshotField } from './baseFields.js'

export const buildVersionGlobalFields = <T extends boolean = false>(
  config: SanitizedConfig,
  global: SanitizedGlobalConfig,
  flatten?: T,
): true extends T ? FlattenedField[] : Field[] => {
  const fields: FlattenedField[] = [
    {
      name: 'version',
      type: 'group',
      fields: global.fields,
      ...(flatten && {
        flattenedFields: global.flattenedFields,
      }),
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

  if (global?.versions?.drafts) {
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

    if (global?.versions?.drafts?.autosave) {
      fields.push({
        name: 'autosave',
        type: 'checkbox',
        index: true,
      })
    }
  }

  return fields as true extends T ? FlattenedField[] : Field[]
}
