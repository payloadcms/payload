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
    beforeChange: [({ value }) => value || new ObjectId().toHexString()],
    beforeDuplicate: [() => new ObjectId().toHexString()],
  },
  label: 'ID',
}
