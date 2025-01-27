import type { SelectField } from '../../payload-types'

export const selectsDoc: Partial<SelectField> = {
  select: 'one',
  selectHasMany: ['two', 'four'],
  settings: {
    category: ['a'],
  },
}
