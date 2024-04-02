import ObjectIdImport from 'bson-objectid'

import type { Field } from '../config/types.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const baseIDField: Field = {
  name: 'id',
  type: 'text',
  admin: {
    hidden: true,
  },
  defaultValue: () => new ObjectId().toHexString(),
  hooks: {
    beforeChange: [
      ({ operation, value }) => {
        // If creating new doc, need to disregard any
        // ids that have been passed in because they will cause
        // primary key unique conflicts in relational DBs
        if (value && operation === 'create') {
          return new ObjectId().toHexString()
        }
      },
    ],
  },
  label: 'ID',
}
