import ObjectIdImport from 'bson-objectid'

import type { TextField } from '../config/types.js'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

export const baseIDField: TextField = {
  name: 'id',
  type: 'text',
  admin: {
    hidden: true,
  },
  defaultValue: () => new ObjectId().toHexString(),
  hooks: {
    beforeChange: [({ value }) => value || new ObjectId().toHexString()],
    // Duplicated rows receive new public identities independently of their database storage keys.
    beforeDuplicate: [() => new ObjectId().toHexString()],
  },
  label: 'ID',
}
