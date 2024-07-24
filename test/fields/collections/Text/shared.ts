import type { RequiredDataFromCollection } from 'payload/types'

import type { TextField } from '../../payload-types.js'

export const defaultText = 'default-text'
export const textFieldsSlug = 'text-fields'

export const textDoc: RequiredDataFromCollection<TextField> = {
  text: 'Seeded text document',
  localizedText: 'Localized text',
  disableListColumnText: 'Disable List Column Text',
  disableListFilterText: 'Disable List Filter Text',
}

export const anotherTextDoc: RequiredDataFromCollection<TextField> = {
  text: 'Another text document',
}
