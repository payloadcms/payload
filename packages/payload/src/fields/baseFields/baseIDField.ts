import type { TextField } from '../config/types.js'

import { generateObjectIdHex } from '../../utilities/objectIdHex.js'

export const baseIDField: TextField = {
  name: 'id',
  type: 'text',
  admin: {
    hidden: true,
  },
  defaultValue: () => generateObjectIdHex(),
  hooks: {
    beforeChange: [({ value }) => value || generateObjectIdHex()],
    // ID field values for arrays and blocks need to be unique when duplicating, as on postgres they are stored on the same table as primary keys.
    beforeDuplicate: [() => generateObjectIdHex()],
  },
  label: 'ID',
}
