import type { JsonField } from '../../payload-types'

export const jsonDoc: Partial<JsonField> = {
  json: {
    arr: ['val1', 'val2', 'val3'],
    nested: {
      value: 'nested value',
    },
    property: 'value',
  },
}
