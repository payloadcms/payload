import ObjectIdImport from 'bson-objectid'

import type { TextField } from '../config/types.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

export const baseIDField: TextField = {
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
        if (!value || (operation === 'create' && value)) {
          return new ObjectId().toHexString()
        }

        return value
      },
    ],
    beforeDuplicate: [
      () => {
        return new ObjectId().toHexString()
      },
    ],
  },
  label: 'ID',
}
