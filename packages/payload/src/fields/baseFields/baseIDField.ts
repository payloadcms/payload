import ObjectID from 'bson-objectid'

import type { Field, FieldHook } from '../config/types'

const generateID: FieldHook = ({ value }) => value || new ObjectID().toHexString()

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
