import ObjectId from 'bson-objectid'

import type { Field, FieldHook } from '../config/types'

const generateID: FieldHook = ({ operation, value }) =>
  (operation !== 'create' ? value : false) || new ObjectId().toHexString()

export const baseIDField: Field = {
  name: 'id',
  admin: {
    disabled: true,
  },
  hooks: {
    beforeChange: [generateID],
  },
  label: 'ID',
  type: 'text',
}
