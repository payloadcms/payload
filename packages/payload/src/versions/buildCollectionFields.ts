import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FlattenedField } from '../fields/config/types.js'

import { hasAutosaveEnabled, hasDraftsEnabled } from '../utilities/getVersionsConfig.js'

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

  if (config.branching?.branchableCollections?.has(collection.slug)) {
    // Mirrors the discriminator on the collection itself. `_branchParent` holds
    // the canonical parent document, since a branch version's `parent` points
    // at the shadow row rather than at the document the editor knows about.
    fields.push(
      {
        name: '_branch',
        type: 'text',
        admin: { disabled: true },
        defaultValue: 'main',
        index: true,
      },
      {
        name: '_branchParent',
        type: 'relationship',
        admin: { disabled: true },
        index: true,
        maxDepth: 0,
        relationTo: collection.slug,
      },
    )
  }

  if (hasDraftsEnabled(collection)) {
    if (config.localization) {
      fields.push({
        name: 'publishedLocale',
        type: 'select',
        admin: {
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

    if (hasAutosaveEnabled(collection)) {
      fields.push({
        name: 'autosave',
        type: 'checkbox',
        index: true,
      })
    }
  }

  return fields as true extends T ? FlattenedField[] : Field[]
}
