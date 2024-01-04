import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { Field } from '../fields/config/types'

export const buildVersionCollectionFields = (collection: SanitizedCollectionConfig): Field[] => {
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
    fields.push({
      name: 'latest',
      type: 'checkbox',
      admin: {
        disabled: true,
      },
      index: true,
    })
  }

  if (collection?.versions?.drafts && collection?.versions?.drafts?.autosave) {
    fields.push({
      name: 'autosave',
      type: 'checkbox',
      index: true,
    })
  }

  return fields
}
