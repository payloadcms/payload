// @ts-strict-ignore
// default beforeDuplicate hook for required and unique fields
import { type FieldAffectingData, type FieldHook, fieldShouldBeLocalized } from './config/types.js'

const unique: FieldHook = ({ value }) => (typeof value === 'string' ? `${value} - Copy` : undefined)
const localizedUnique: FieldHook = ({ req, value }) =>
  value ? `${value} - ${req?.t('general:copy') ?? 'Copy'}` : undefined
const uniqueRequired: FieldHook = ({ value }) => `${value} - Copy`
const localizedUniqueRequired: FieldHook = ({ req, value }) =>
  `${value} - ${req?.t('general:copy') ?? 'Copy'}`

export const setDefaultBeforeDuplicate = (
  field: FieldAffectingData,
  parentIsLocalized: boolean,
) => {
  if (
    (('required' in field && field.required) || field.unique) &&
    (!field.hooks?.beforeDuplicate ||
      (Array.isArray(field.hooks.beforeDuplicate) && field.hooks.beforeDuplicate.length === 0))
  ) {
    if ((field.type === 'text' || field.type === 'textarea') && field.required && field.unique) {
      field.hooks.beforeDuplicate = [
        fieldShouldBeLocalized({ field, parentIsLocalized })
          ? localizedUniqueRequired
          : uniqueRequired,
      ]
    } else if (field.unique) {
      field.hooks.beforeDuplicate = [
        fieldShouldBeLocalized({ field, parentIsLocalized }) ? localizedUnique : unique,
      ]
    }
  }
}
