// default beforeDuplicate hook for required and unique fields
import type { FieldAffectingData, FieldHook } from './config/types.js'

import { extractTranslations } from '../translations/extractTranslations.js'

const copyTranslations = extractTranslations(['general:copy'])

const unique: FieldHook = ({ value }) => (typeof value === 'string' ? `${value} - Copy` : undefined)
const localizedUnique: FieldHook = ({ req, value }) =>
  value ? `${value} - ${copyTranslations?.[req.locale]?.['general:copy'] ?? 'Copy'}` : undefined
const uniqueRequired: FieldHook = ({ value }) => `${value} - Copy`
const localizedUniqueRequired: FieldHook = ({ req, value }) =>
  `${value} - ${copyTranslations?.[req.locale]?.['general:copy'] ?? 'Copy'}`

export const setDefaultBeforeDuplicate = (field: FieldAffectingData) => {
  if (
    (('required' in field && field.required) || field.unique) &&
    (!field.hooks?.beforeDuplicate ||
      (Array.isArray(field.hooks.beforeDuplicate) && field.hooks.beforeDuplicate.length === 0))
  ) {
    if ((field.type === 'text' || field.type === 'textarea') && field.required && field.unique) {
      field.hooks.beforeDuplicate = [field.localized ? localizedUniqueRequired : uniqueRequired]
    } else if (field.unique) {
      field.hooks.beforeDuplicate = [field.localized ? localizedUnique : unique]
    }
  }
}
