import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { Field } from '../fields/config/types'

export const buildVersionCollectionFields = (collection: SanitizedCollectionConfig): Field[] => {
  const fields: Field[] = [
    {
      name: 'parent',
      index: true,
      relationTo: collection.slug,
      type: 'relationship',
    },
    {
      name: 'version',
      fields: collection.fields,
      type: 'group',
    },
    {
      name: 'createdAt',
      admin: {
        disabled: true,
      },
      index: true,
      type: 'date',
    },
    {
      name: 'updatedAt',
      admin: {
        disabled: true,
      },
      index: true,
      type: 'date',
    },
  ]

  if (collection?.versions?.drafts) {
    fields.push({
      name: 'latest',
      admin: {
        disabled: true,
      },
      index: true,
      type: 'checkbox',
    })
  }

  if (collection?.versions?.drafts && collection?.versions?.drafts?.autosave) {
    fields.push({
      name: 'autosave',
      index: true,
      type: 'checkbox',
    })
  }

  return fields
}
