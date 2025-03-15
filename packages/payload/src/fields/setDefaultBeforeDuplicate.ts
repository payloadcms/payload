// @ts-strict-ignore
// default beforeDuplicate hook for required and unique fields
import { type FieldAffectingData, type FieldHook, fieldShouldBeLocalized } from './config/types.js'
import { handleUniqueFields } from './utilities/handleUniqueFields.ts.js'

const hasValue = (value) => typeof value === 'string' && value.trim() !== ''
const unique: FieldHook = ({ value }) => (hasValue(value) ? `${value} - Copy` : undefined)
const localizedUnique: FieldHook = ({ req, value }) =>
  hasValue(value) ? `${value} - ${req?.t('general:copy') ?? 'Copy'}` : undefined
const numberUnique: FieldHook = ({ value }) => (value ? `${value + 1}` : undefined)
const resetUnique: FieldHook = () => undefined

export const setDefaultBeforeDuplicate = (
  field: FieldAffectingData,
  parentIsLocalized: boolean,
) => {
  if (
    (('required' in field && field.required) || field.unique) &&
    (!field.hooks?.beforeDuplicate ||
      (Array.isArray(field.hooks.beforeDuplicate) && field.hooks.beforeDuplicate.length === 0))
  ) {
    if (field.unique) {
      const updateStrategy = handleUniqueFields(field.type)

      const strategyHooks = {
        append: [fieldShouldBeLocalized({ field, parentIsLocalized }) ? localizedUnique : unique],
        numericallyAppend: [numberUnique],
        undefined: [resetUnique],
      }

      if (strategyHooks[updateStrategy]) {
        field.hooks.beforeDuplicate = strategyHooks[updateStrategy]
      }
    }
  }
}
