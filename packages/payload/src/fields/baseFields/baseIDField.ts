import ObjectId from 'bson-objectid'

import type { Field, FieldHook } from '../config/types.d.ts'

const generateID: FieldHook = ({ operation, value }) =>
  (operation !== 'create' ? value : false) || new ObjectId.default().toHexString()

export const baseIDField: Field = {
  name: 'id',
  type: 'text',
  admin: {
    disabled: true,
  },
  hooks: {
    beforeChange: [generateID],
  },
  label: 'ID',
}
