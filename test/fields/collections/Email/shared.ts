import type { RequiredDataFromCollection } from 'payload/types'

import type { EmailField } from '../../payload-types.js'

export const defaultEmail = 'dev@example.com'

export const emailFieldsSlug = 'email-fields'

export const emailDoc: RequiredDataFromCollection<EmailField> = {
  email: 'dev@example.com',
  localizedEmail: 'another@example.com',
}

export const anotherEmailDoc: RequiredDataFromCollection<EmailField> = {
  email: 'user@example.com',
}
