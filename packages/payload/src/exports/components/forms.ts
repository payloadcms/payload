export { default as Error } from '../../admin/components/forms/Error'

export { default as FieldDescription } from '../../admin/components/forms/FieldDescription'

export { default as Form } from '../../admin/components/forms/Form'

export {
  useAllFormFields,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useFormSubmitted,
  /**
   * @deprecated useWatchForm is no longer preferred. If you need all form fields, prefer `useAllFormFields`.
   */
  useWatchForm,
} from '../../admin/components/forms/Form/context'

export { default as getSiblingData } from '../../admin/components/forms/Form/getSiblingData'
export { default as reduceFieldsToValues } from '../../admin/components/forms/Form/reduceFieldsToValues'

export { default as Label } from '../../admin/components/forms/Label'

export { default as Submit } from '../../admin/components/forms/Submit'
export { default as Checkbox } from '../../admin/components/forms/field-types/Checkbox'

export { default as Group } from '../../admin/components/forms/field-types/Group'
export { default as Select } from '../../admin/components/forms/field-types/Select'
export { default as SelectInput } from '../../admin/components/forms/field-types/Select/Input'

export { default as Text } from '../../admin/components/forms/field-types/Text'
export { default as TextInput } from '../../admin/components/forms/field-types/Text/Input'

/**
 * @deprecated This method is now called useField. The useFieldType alias will be removed in an upcoming version.
 */
export { default as useFieldType } from '../../admin/components/forms/useField'
export { default as useField } from '../../admin/components/forms/useField'
export { default as withCondition } from '../../admin/components/forms/withCondition'
