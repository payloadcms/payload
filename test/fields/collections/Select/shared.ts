import type { SelectField } from '../../payload-types.js'

export const selectsDoc: Partial<SelectField> = {
  select: 'one',
  selectHasMany: ['two', 'four'],
  settings: {
    category: ['a'],
  },
}
