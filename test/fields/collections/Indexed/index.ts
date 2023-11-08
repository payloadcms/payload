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
    partOne: data.partOne ? `${data.partOne}-copy` : '',
    partTwo: data.partTwo ? `${data.partTwo}-copy` : '',
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
      index: true,
      required: true,
      type: 'text',
    },
    {
      name: 'uniqueText',
      type: 'text',
      unique: true,
    },
    {
      name: 'point',
      type: 'point',
    },
    {
      name: 'group',
      fields: [
        {
          name: 'localizedUnique',
          localized: true,
          type: 'text',
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
      type: 'group',
    },
    {
      fields: [
        {
          name: 'collapsibleLocalizedUnique',
          localized: true,
          type: 'text',
          unique: true,
        },
        {
          name: 'collapsibleTextUnique',
          label: 'collapsibleTextUnique',
          type: 'text',
          unique: true,
        },
      ],
      label: 'Collapsible',
      type: 'collapsible',
    },
  ],
  versions: true,
}

export default IndexedFields
