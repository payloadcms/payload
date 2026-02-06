import type { RequiredDataFromCollection } from 'payload'

import type { TextareaField } from '../../payload-types.js'

export const defaultText = 'default-text'
export const textareaFieldsSlug = 'textarea-fields'

export const textareaDoc: RequiredDataFromCollection<TextareaField> = {
  text: 'Seeded text document',
  localizedText: 'Localized text',
}

export const anotherTextareaDoc: RequiredDataFromCollection<TextareaField> = {
  text: 'Another text document',
}
