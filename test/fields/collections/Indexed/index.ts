import type {
  BeforeDuplicate,
  CollectionConfig,
} from '../../../../packages/payload/src/collections/config/types'
import type { IndexedField } from '../../payload-types'

import { indexedFieldsSlug } from '../../slugs'

const beforeDuplicate: BeforeDuplicate<IndexedField> = ({ data }) => {
  return {
    ...data,
    collapsibleLocalizedUnique: data.collapsibleLocalizedUnique
      ? `${data.collapsibleLocalizedUnique}-copy`
      : '',
    collapsibleTextUnique: data.collapsibleTextUnique ? `${data.collapsibleTextUnique}-copy` : '',
    group: {
      ...(data.group || {}),
      localizedUnique: data.group?.localizedUnique ? `${data.group?.localizedUnique}-copy` : '',
    },
    uniqueText: data.uniqueText ? `${data.uniqueText}-copy` : '',
  }
}

const IndexedFields: CollectionConfig = {
  slug: indexedFieldsSlug,
  // used to assert that versions also get indexes
  admin: {
    hooks: {
      beforeDuplicate,
    },
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'uniqueText',
      type: 'text',
      unique: true,
    },
    {
      name: 'uniqueRequiredText',
      type: 'text',
      defaultValue: 'uniqueRequired',
      required: true,
      unique: true,
    },
    {
      name: 'point',
      type: 'point',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'localizedUnique',
          type: 'text',
          localized: true,
          unique: true,
        },
        {
          name: 'unique',
          type: 'text',
          unique: true,
        },
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
    {
      type: 'collapsible',
      fields: [
        {
          name: 'collapsibleLocalizedUnique',
          type: 'text',
          localized: true,
          unique: true,
        },
        {
          name: 'collapsibleTextUnique',
          type: 'text',
          label: 'collapsibleTextUnique',
          unique: true,
        },
      ],
      label: 'Collapsible',
    },
  ],
  versions: true,
}

export default IndexedFields
