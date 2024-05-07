import type { TextField } from '../../payload-types'

export const defaultText = 'default-text'
export const textFieldsSlug = 'text-fields'

export const textDoc: Partial<TextField> = {
  text: 'Seeded text document',
  localizedText: 'Localized text',
  disableListColumnText: 'Disable List Column Text',
  disableListFilterText: 'Disable List Filter Text',
}

export const anotherTextDoc: Partial<TextField> = {
  text: 'Another text document',
}
