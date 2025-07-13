import type { SelectField } from '../../payload-types.js'

export const selectsDoc: Partial<SelectField> = {
  select: 'one',
  selectHasMany: ['two', 'four'],
  selectSoft: 'country-one',
  selectSoftHasMany: ['lang-one', 'lang-three'],
  settings: {
    category: ['a'],
  },
}
